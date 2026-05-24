import { prisma } from '@/server/db'
import { getSegmentBySlug, type SegmentSlug } from '@/lib/segments'
import { getCityBySlug, type CitySlug } from '@/lib/cities'

const TTL_MS = 12 * 60 * 60 * 1000

interface FetchOptions {
  forceRefresh?: boolean
}

// ─── SerpAPI response types ───────────────────────────────────────────────────

interface SerpApiValueEntry {
  query?: string
  value?: string
  extracted_value?: number
}

interface SerpApiTimelineEntry {
  date?: string
  timestamp?: string
  values?: SerpApiValueEntry[]
}

interface SerpApiRegionEntry {
  coordinates?: { lat?: number; lng?: number }
  location?: string
  max_value_index?: number
  values?: SerpApiValueEntry[]
}

interface SerpApiTopic {
  topic?: { value?: string; title?: string; type?: string }
  value?: string
  extracted_value?: number
  link?: string
}

interface SerpApiQueryEntry {
  query?: string
  value?: string
  extracted_value?: number
  link?: string
}

// ─── Normalised cache payload types ──────────────────────────────────────────

export interface InterestOverTimePayload {
  timeline_data?: SerpApiTimelineEntry[]
  averages?: Array<{ query?: string; value?: string }>
  related_queries?: { rising?: SerpApiQueryEntry[]; top?: SerpApiQueryEntry[] }
}

export interface InterestByRegionPayload {
  region?: SerpApiRegionEntry[]
}

export interface RelatedTopicsPayload {
  rising?: SerpApiTopic[]
  top?: SerpApiTopic[]
}

// ─── SerpAPI calls ────────────────────────────────────────────────────────────

async function serpApiFetch(params: Record<string, string>) {
  const qs = new URLSearchParams({
    engine: 'google_trends',
    date: 'today 3-m',
    hl: 'pt-BR',
    api_key: process.env.SERPAPI_KEY!,
    ...params,
  })
  const res = await fetch(`https://serpapi.com/search.json?${qs}`)
  return res.json()
}

async function fetchTimeseries(keywords: readonly string[], geo: string) {
  return serpApiFetch({ q: keywords.join(','), geo }) as Promise<{
    interest_over_time?: { timeline_data?: SerpApiTimelineEntry[]; averages?: any[] }
    error?: string
  }>
}

async function fetchGeoMap(keywords: readonly string[], geo: string) {
  return serpApiFetch({ q: keywords.join(','), geo, data_type: 'GEO_MAP' }) as Promise<{
    compared_breakdown_by_region?: SerpApiRegionEntry[]
    error?: string
  }>
}

async function fetchRelatedTopics(keyword: string, geo: string) {
  return serpApiFetch({ q: keyword, geo, data_type: 'RELATED_TOPICS' }) as Promise<{
    related_topics?: { rising?: SerpApiTopic[]; top?: SerpApiTopic[] }
    error?: string
  }>
}

async function fetchRelatedQueries(keyword: string, geo: string) {
  return serpApiFetch({ q: keyword, geo, data_type: 'RELATED_QUERIES' }) as Promise<{
    related_queries?: { rising?: SerpApiQueryEntry[]; top?: SerpApiQueryEntry[] }
    error?: string
  }>
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function saveAllCacheTypes(
  segmentSlug: string,
  citySlug: string,
  geoUsed: string,
  {
    timeseries,
    geomap,
    topics,
    queries,
  }: {
    timeseries: Awaited<ReturnType<typeof fetchTimeseries>>
    geomap: Awaited<ReturnType<typeof fetchGeoMap>>
    topics: Awaited<ReturnType<typeof fetchRelatedTopics>>
    queries: Awaited<ReturnType<typeof fetchRelatedQueries>>
  },
) {
  const expiresAt = new Date(Date.now() + TTL_MS)

  const overTimePayload: InterestOverTimePayload | null = timeseries.interest_over_time
    ? {
        ...timeseries.interest_over_time,
        related_queries: queries.related_queries ?? undefined,
      }
    : null

  const regionPayload: InterestByRegionPayload | null =
    geomap.compared_breakdown_by_region?.length
      ? { region: geomap.compared_breakdown_by_region }
      : null

  const topicsPayload: RelatedTopicsPayload | null =
    topics.related_topics?.rising?.length || topics.related_topics?.top?.length
      ? topics.related_topics
      : null

  const types = [
    { dataType: 'interest_over_time', data: overTimePayload },
    { dataType: 'interest_by_region', data: regionPayload },
    { dataType: 'related_topics', data: topicsPayload },
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

// ─── Core fetch (all data types in parallel) ─────────────────────────────────

async function fetchAllFromSerpApi(
  keywords: readonly string[],
  geo: string,
): Promise<{
  timeseries: Awaited<ReturnType<typeof fetchTimeseries>>
  geomap: Awaited<ReturnType<typeof fetchGeoMap>>
  topics: Awaited<ReturnType<typeof fetchRelatedTopics>>
  queries: Awaited<ReturnType<typeof fetchRelatedQueries>>
}> {
  const [timeseries, geomap, topics, queries] = await Promise.all([
    fetchTimeseries(keywords, geo),
    fetchGeoMap(keywords, geo),
    fetchRelatedTopics(keywords[0], geo),
    fetchRelatedQueries(keywords[0], geo),
  ])
  return { timeseries, geomap, topics, queries }
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
      return { data: cached.payload as InterestOverTimePayload, geoUsed: cached.geoUsed, fromCache: true }
    }
  }

  const segment = getSegmentBySlug(segmentSlug)
  const city = getCityBySlug(citySlug)

  // First try with city geo; fall back to state if empty or API error
  const firstTry = await fetchTimeseries(segment.keywords, city.geoCode)
  const isEmpty = !firstTry.interest_over_time?.timeline_data?.length
  const geoFinal = isEmpty ? 'BR-PI' : city.geoCode

  // Fetch remaining data types (re-fetch timeseries only if geo changed)
  const allData = isEmpty
    ? await fetchAllFromSerpApi(segment.keywords, 'BR-PI')
    : {
        timeseries: firstTry,
        ...(await Promise.all([
          fetchGeoMap(segment.keywords, geoFinal),
          fetchRelatedTopics(segment.keywords[0], geoFinal),
          fetchRelatedQueries(segment.keywords[0], geoFinal),
        ]).then(([geomap, topics, queries]) => ({ geomap, topics, queries }))),
      }

  await saveAllCacheTypes(segmentSlug, citySlug, geoFinal, allData)

  return {
    data: allData.timeseries.interest_over_time
      ? ({
          ...allData.timeseries.interest_over_time,
          related_queries: allData.queries.related_queries ?? undefined,
        } as InterestOverTimePayload)
      : null,
    geoUsed: geoFinal,
    fromCache: false,
  }
}

export async function fetchSegmentTrendsByRegion(
  segmentSlug: SegmentSlug,
  citySlug: CitySlug,
) {
  const cached = await prisma.segmentTrendsCache.findUnique({
    where: {
      segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: 'interest_by_region' },
    },
  })
  if (cached && cached.expiresAt > new Date()) {
    return { data: cached.payload as InterestByRegionPayload, fromCache: true }
  }
  await fetchSegmentTrends(segmentSlug, citySlug, { forceRefresh: true })
  const fresh = await prisma.segmentTrendsCache.findUnique({
    where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: 'interest_by_region' } },
  })
  return { data: (fresh?.payload ?? null) as InterestByRegionPayload | null, fromCache: false }
}

export async function fetchSegmentRelatedTopics(
  segmentSlug: SegmentSlug,
  citySlug: CitySlug,
) {
  const cached = await prisma.segmentTrendsCache.findUnique({
    where: {
      segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: 'related_topics' },
    },
  })
  if (cached && cached.expiresAt > new Date()) {
    return { data: cached.payload as RelatedTopicsPayload, fromCache: true }
  }
  await fetchSegmentTrends(segmentSlug, citySlug, { forceRefresh: true })
  const fresh = await prisma.segmentTrendsCache.findUnique({
    where: { segmentSlug_citySlug_dataType: { segmentSlug, citySlug, dataType: 'related_topics' } },
  })
  return { data: (fresh?.payload ?? null) as RelatedTopicsPayload | null, fromCache: false }
}
