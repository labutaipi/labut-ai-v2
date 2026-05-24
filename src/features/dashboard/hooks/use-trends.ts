'use client'

import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'

interface TrendsInput {
  segmentSlug: string
  citySlug: string
}

export function useTrends(input: TrendsInput | null) {
  return useQuery({
    ...orpc.trends.get.queryOptions({
      input: input ?? { segmentSlug: '', citySlug: '' },
    }),
    enabled: !!input,
  })
}

export function useTrendsByRegion(input: TrendsInput | null) {
  return useQuery({
    ...orpc.trends.byRegion.queryOptions({
      input: input ?? { segmentSlug: '', citySlug: '' },
    }),
    enabled: !!input,
  })
}

export function useTrendTopics(input: TrendsInput | null) {
  return useQuery({
    ...orpc.trends.topics.queryOptions({
      input: input ?? { segmentSlug: '', citySlug: '' },
    }),
    enabled: !!input,
  })
}

export function useNeighborhoodMap(input: TrendsInput | null) {
  return useQuery({
    ...orpc.trends.neighborhood.queryOptions({
      input: input ?? { segmentSlug: '', citySlug: '' },
    }),
    enabled: !!input,
  })
}

export function useTrendsCacheInfo(input: TrendsInput | null) {
  return useQuery({
    ...orpc.trends.cacheInfo.queryOptions({
      input: input ?? { segmentSlug: '', citySlug: '' },
    }),
    enabled: !!input,
  })
}
