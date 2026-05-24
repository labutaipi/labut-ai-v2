import 'server-only'
import { prisma } from '@/server/db'
import type { SegmentSlug } from '@/lib/segments'
import { getSegmentBySlug } from '@/lib/segments'

const TTL_MS = 48 * 60 * 60 * 1000 // 48h — dado estável
const DATA_TYPE = 'neighborhood_map_v2'
const ZOOM = '14z' // ~1-2km radius, ideal para um bairro

// Principais bairros de Teresina com coordenadas centrais
const TERESINA_NEIGHBORHOODS = [
  { name: 'Centro',       lat: -5.0892, lng: -42.8019 },
  { name: 'Jóquei',       lat: -5.0705, lng: -42.7793 },
  { name: 'Fátima',       lat: -5.0648, lng: -42.7974 },
  { name: 'Ininga',       lat: -5.1048, lng: -42.7800 },
  { name: 'Horto',        lat: -5.0764, lng: -42.8178 },
  { name: 'Noivos',       lat: -5.0527, lng: -42.8078 },
  { name: 'Mocambinho',   lat: -5.0305, lng: -42.8266 },
  { name: 'Dirceu',       lat: -5.1167, lng: -42.7703 },
  { name: 'Uruguai',      lat: -5.1061, lng: -42.8005 },
  { name: 'Saci',         lat: -5.0525, lng: -42.7947 },
] as const

export interface NeighborhoodResult {
  name: string
  businessCount: number
  avgRating: number | null
  avgReviews: number | null
  opportunityScore: number // 0–100
}

export type NeighborhoodMapPayload = NeighborhoodResult[]

async function fetchNeighborhoodData(
  keyword: string,
  neighborhoodName: string,
  lat: number,
  lng: number,
): Promise<{ count: number; avgRating: number | null; avgReviews: number | null }> {
  const ll = `@${lat},${lng},${ZOOM}`
  // Incluindo o nome do bairro na query para resultados específicos por região
  const q = `${keyword} ${neighborhoodName}`
  const qs = new URLSearchParams({
    engine: 'google_maps',
    q,
    ll,
    hl: 'pt-BR',
    api_key: process.env.SERPAPI_KEY!,
  })
  const res = await fetch(`https://serpapi.com/search.json?${qs}`)
  const data = await res.json()

  const results: any[] = data?.local_results ?? []
  if (!results.length) return { count: 0, avgRating: null, avgReviews: null }

  const count = results.length
  const ratings = results.map((r) => r.rating).filter((r): r is number => typeof r === 'number')
  const reviews = results.map((r) => r.reviews).filter((r): r is number => typeof r === 'number')

  const avgRating = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : null
  const avgReviews = reviews.length ? reviews.reduce((s, v) => s + v, 0) / reviews.length : null

  return { count, avgRating, avgReviews: avgReviews ? Math.round(avgReviews) : null }
}

// Escala absoluta de concorrência — evita que todos fiquem empatados quando counts são iguais
function competitionScore(count: number): number {
  if (count === 0) return 0       // sem concorrência = oportunidade máxima
  if (count <= 2) return 15
  if (count <= 5) return 35
  if (count <= 8) return 55
  if (count <= 12) return 75
  return 90                        // 13+ negócios = muito saturado
}

function computeOpportunityScores(raw: Array<{ name: string; count: number; avgRating: number | null; avgReviews: number | null }>): NeighborhoodResult[] {
  return raw.map((r): NeighborhoodResult => {
    const competition = competitionScore(r.count)
    // satisfactionGap: 0 (avaliações perfeitas 5★) → 100 (péssimas 1★)
    const satisfactionGap = r.avgRating != null ? ((5 - r.avgRating) / 4) * 100 : 50
    const opportunityScore = Math.round((100 - competition) * 0.6 + satisfactionGap * 0.4)

    return {
      name: r.name,
      businessCount: r.count,
      avgRating: r.avgRating,
      avgReviews: r.avgReviews,
      opportunityScore,
    }
  })
}

// Retorna do cache ou busca fresco para todos os bairros em paralelo
export async function fetchNeighborhoodMap(
  segmentSlug: SegmentSlug,
  citySlug: string,
): Promise<{ data: NeighborhoodMapPayload; fromCache: boolean }> {
  // Apenas Teresina tem granularidade por bairro
  if (citySlug !== 'teresina') return { data: [], fromCache: false }

  const cached = await prisma.segmentTrendsCache.findUnique({
    where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: DATA_TYPE } },
  })
  if (cached && cached.expiresAt > new Date()) {
    return { data: cached.payload as unknown as NeighborhoodMapPayload, fromCache: true }
  }

  const segment = getSegmentBySlug(segmentSlug)
  const keyword = segment.label // ex: "Salão de Beleza", "Alimentação"

  // Busca todos os bairros em paralelo
  const raw = await Promise.all(
    TERESINA_NEIGHBORHOODS.map(async (n) => {
      const result = await fetchNeighborhoodData(keyword, n.name, n.lat, n.lng)
      return { name: n.name, ...result }
    }),
  )

  const payload = computeOpportunityScores(raw).sort((a, b) => b.opportunityScore - a.opportunityScore)

  await prisma.segmentTrendsCache.upsert({
    where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: DATA_TYPE } },
    update: { payload: payload as any, geoUsed: 'BR-PI-TEI', fetchedAt: new Date(), expiresAt: new Date(Date.now() + TTL_MS) },
    create: { segmentSlug, citySlug, dataType: DATA_TYPE, payload: payload as any, geoUsed: 'BR-PI-TEI', expiresAt: new Date(Date.now() + TTL_MS) },
  })

  return { data: payload, fromCache: false }
}
