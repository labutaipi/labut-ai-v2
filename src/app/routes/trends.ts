import * as z from 'zod'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'
import { isValidSegmentSlug } from '@/lib/segments'
import { isValidCitySlug } from '@/lib/cities'
import {
  fetchSegmentTrends,
  fetchSegmentTrendsByRegion,
  fetchSegmentRelatedTopics,
} from '@/lib/serpapi/trends'
import { fetchNeighborhoodMap } from '@/lib/serpapi/neighborhood'

const trendsInput = z.object({
  segmentSlug: z.string().refine(isValidSegmentSlug, 'Segmento inválido'),
  citySlug: z.string().refine(isValidCitySlug, 'Cidade inválida'),
})

export const trendsRouter = {
  get: protectedProcedure.input(trendsInput).handler(async ({ input }) => {
    return fetchSegmentTrends(input.segmentSlug as any, input.citySlug as any)
  }),

  byRegion: protectedProcedure.input(trendsInput).handler(async ({ input }) => {
    return fetchSegmentTrendsByRegion(input.segmentSlug as any, input.citySlug as any)
  }),

  topics: protectedProcedure.input(trendsInput).handler(async ({ input }) => {
    return fetchSegmentRelatedTopics(input.segmentSlug as any, input.citySlug as any)
  }),

  neighborhood: protectedProcedure.input(trendsInput).handler(async ({ input }) => {
    return fetchNeighborhoodMap(input.segmentSlug as any, input.citySlug)
  }),

  cacheInfo: protectedProcedure
    .input(z.object({ segmentSlug: z.string(), citySlug: z.string() }))
    .handler(async ({ input }) => {
      return prisma.segmentTrendsCache.findUnique({
        where: {
          segmentSlug_citySlug_dataType: {
            segmentSlug: input.segmentSlug,
            citySlug: input.citySlug,
            dataType: 'interest_over_time',
          },
        },
        select: { fetchedAt: true, expiresAt: true, geoUsed: true },
      })
    }),
}
