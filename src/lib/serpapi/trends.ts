import { prisma } from '@/server/db'
import { getSegmentBySlug, type SegmentSlug } from '@/lib/segments'
import { getCityBySlug, type CitySlug } from '@/lib/cities'

const TTL_MS = 12 * 60 * 60 * 1000 // 12 horas

interface FetchOptions {
  forceRefresh?: boolean
}

export async function fetchSegmentTrends(
  segmentSlug: SegmentSlug,
  citySlug: CitySlug,
  options: FetchOptions = {},
) {
  if (!options.forceRefresh) {
    const cached = await prisma.segmentTrendsCache.findUnique({
      where: {
        segmentSlug_citySlug_dataType: {
          segmentSlug,
          citySlug,
          dataType: 'interest_over_time',
        },
      },
    })

    if (cached && cached.expiresAt > new Date()) {
      return { data: cached.payload, geoUsed: cached.geoUsed, fromCache: true }
    }
  }

  const segment = getSegmentBySlug(segmentSlug)
  const city = getCityBySlug(citySlug)

  const data = await callSerpApi(segment.keywords, city.geoCode)

  const isEmpty = !(data as any)?.interest_over_time?.timeline_data?.length
  const geoFinal = isEmpty ? 'BR-PI' : city.geoCode
  const payload = isEmpty ? await callSerpApi(segment.keywords, 'BR-PI') : data

  await saveAllCacheTypes(segmentSlug, citySlug, geoFinal, payload)

  return { data: (payload as any).interest_over_time, geoUsed: geoFinal, fromCache: false }
}

export async function fetchSegmentTrendsByRegion(
  segmentSlug: SegmentSlug,
  citySlug: CitySlug,
) {
  const cached = await prisma.segmentTrendsCache.findUnique({
    where: {
      segmentSlug_citySlug_dataType: {
        segmentSlug,
        citySlug,
        dataType: 'interest_by_region',
      },
    },
  })
  if (cached && cached.expiresAt > new Date()) {
    return { data: cached.payload, fromCache: true }
  }
  // Se não há cache, forçar refresh completo
  await fetchSegmentTrends(segmentSlug, citySlug, { forceRefresh: true })
  const fresh = await prisma.segmentTrendsCache.findUnique({
    where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: 'interest_by_region' } },
  })
  return { data: fresh?.payload ?? null, fromCache: false }
}

export async function fetchSegmentRelatedTopics(
  segmentSlug: SegmentSlug,
  citySlug: CitySlug,
) {
  const cached = await prisma.segmentTrendsCache.findUnique({
    where: {
      segmentSlug_citySlug_dataType: {
        segmentSlug,
        citySlug,
        dataType: 'related_topics',
      },
    },
  })
  if (cached && cached.expiresAt > new Date()) {
    return { data: cached.payload, fromCache: true }
  }
  await fetchSegmentTrends(segmentSlug, citySlug, { forceRefresh: true })
  const fresh = await prisma.segmentTrendsCache.findUnique({
    where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: 'related_topics' } },
  })
  return { data: fresh?.payload ?? null, fromCache: false }
}

async function saveAllCacheTypes(
  segmentSlug: string,
  citySlug: string,
  geoUsed: string,
  payload: any,
) {
  const expiresAt = new Date(Date.now() + TTL_MS)

  const types: Array<{ dataType: string; data: unknown }> = [
    { dataType: 'interest_over_time', data: payload.interest_over_time ?? null },
    { dataType: 'interest_by_region', data: payload.interest_by_region ?? null },
    { dataType: 'related_topics',     data: payload.related_topics ?? null },
  ]

  for (const { dataType, data } of types) {
    if (!data) continue
    await prisma.segmentTrendsCache.upsert({
      where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType } },
      update: { payload: data as any, geoUsed, fetchedAt: new Date(), expiresAt },
      create: { segmentSlug, citySlug, dataType, payload: data as any, geoUsed, expiresAt },
    })
  }
}

async function callSerpApi(keywords: readonly string[], geo: string) {
  const params = new URLSearchParams({
    engine: 'google_trends',
    q: keywords.join(','),
    geo,
    date: 'today 3-m',
    hl: 'pt-BR',
    api_key: process.env.SERPAPI_KEY!,
  })

  const res = await fetch(`https://serpapi.com/search.json?${params}`)
  return res.json()
}
