import * as z from 'zod'
import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'
import { generateInsights, hashInsightInput, type InsightContent } from '@/lib/ai/insights'
import { getSegmentBySlug, isValidSegmentSlug } from '@/lib/segments'
import { getCityBySlug, isValidCitySlug } from '@/lib/cities'
import { getAudienceBySlug } from '@/lib/audiences'

const RATE_LIMIT_FREE_MS = 24 * 60 * 60 * 1000 // 1x por dia no FREE

export const insightsRouter = {
  latest: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    const insight = await prisma.aIInsight.findFirst({
      where: { userId: context.userId },
      orderBy: { generatedAt: 'desc' },
    })
    if (!insight) return null

    const content: InsightContent = JSON.parse(insight.content)
    return { ...insight, content }
  }),

  generate: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        businessName: true,
        segmentSlug: true,
        citySlug: true,
        targetAudience: true,
        plan: true,
      },
    })

    if (!user?.segmentSlug || !isValidSegmentSlug(user.segmentSlug)) {
      throw new ORPCError('BAD_REQUEST', { message: 'Perfil incompleto. Complete o onboarding.' })
    }
    if (!user.citySlug || !isValidCitySlug(user.citySlug)) {
      throw new ORPCError('BAD_REQUEST', { message: 'Perfil incompleto. Complete o onboarding.' })
    }

    const segment = getSegmentBySlug(user.segmentSlug as any)
    const city = getCityBySlug(user.citySlug as any)
    const audience = user.targetAudience
      ? getAudienceBySlug(user.targetAudience as any)
      : { label: 'Todos os públicos' }

    // Buscar dados de trends do cache
    const trendsCache = await prisma.segmentTrendsCache.findUnique({
      where: {
        segmentSlug_citySlug_dataType: {
          segmentSlug: user.segmentSlug,
          citySlug: user.citySlug,
          dataType: 'interest_over_time',
        },
      },
    })

    const timeline = (trendsCache?.payload as any)?.timeline_data ?? []
    const values: number[] = timeline.flatMap(
      (d: any) => d.values?.map((v: any) => v.extracted_value ?? 0) ?? [],
    )
    const peak = values.length ? Math.max(...values) : 0
    const avg = values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0
    const last = values.at(-1) ?? 0
    const prev = values.at(-2) ?? last
    const trend: 'up' | 'down' | 'neutral' =
      last > prev ? 'up' : last < prev ? 'down' : 'neutral'

    const relatedCache = await prisma.segmentTrendsCache.findUnique({
      where: {
        segmentSlug_citySlug_dataType: {
          segmentSlug: user.segmentSlug,
          citySlug: user.citySlug,
          dataType: 'related_queries',
        },
      },
    })
    const risingQueries: string[] =
      (relatedCache?.payload as any)?.rising?.map((q: any) => q.query).filter(Boolean) ?? []

    const input = {
      businessName: user.businessName,
      segmentLabel: segment.label,
      cityLabel: city.label,
      audienceLabel: audience.label,
      peak,
      avg,
      trend,
      risingQueries,
    }

    const dataHash = hashInsightInput(input)

    // Rate limit para FREE
    if (user.plan === 'FREE') {
      const last = await prisma.aIInsight.findFirst({
        where: { userId: context.userId },
        orderBy: { generatedAt: 'desc' },
      })
      if (last && Date.now() - last.generatedAt.getTime() < RATE_LIMIT_FREE_MS) {
        const content: InsightContent = JSON.parse(last.content)
        return { ...last, content }
      }
    }

    // Evitar regenerar se dados não mudaram
    const existing = await prisma.aIInsight.findFirst({
      where: { userId: context.userId, dataHash },
      orderBy: { generatedAt: 'desc' },
    })
    if (existing) {
      const content: InsightContent = JSON.parse(existing.content)
      return { ...existing, content }
    }

    const content = await generateInsights(input)

    const insight = await prisma.aIInsight.create({
      data: {
        userId: context.userId,
        content: JSON.stringify(content),
        dataHash,
      },
    })

    return { ...insight, content }
  }),
}
