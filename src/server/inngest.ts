import { Inngest } from 'inngest'
import { prisma } from '@/server/db'
import { fetchSegmentTrends } from '@/lib/serpapi/trends'
import { fetchBusinessProfile } from '@/lib/serpapi/business'
import { generateInsights, hashInsightInput } from '@/lib/ai/insights'
import { getSegmentBySlug, isValidSegmentSlug } from '@/lib/segments'
import { getCityBySlug, isValidCitySlug } from '@/lib/cities'
import { getAudienceBySlug } from '@/lib/audiences'

export const inngest = new Inngest({ id: 'mei-piaui' })

export const updateTrendsCache = inngest.createFunction(
  { id: 'update-trends-cache', triggers: [{ cron: '0 6,18 * * *' }] },
  async ({ step }) => {
    const activeCombos = await step.run('fetch-active-combos', async () => {
      return prisma.user.findMany({
        where: {
          segmentSlug: { not: null },
          citySlug: { not: null },
          sessions: { some: { expiresAt: { gt: new Date() } } },
        },
        select: { segmentSlug: true, citySlug: true },
        distinct: ['segmentSlug', 'citySlug'],
      })
    })

    await step.run('refresh-caches', async () => {
      for (const { segmentSlug, citySlug } of activeCombos) {
        await fetchSegmentTrends(segmentSlug as any, citySlug as any, { forceRefresh: true })
      }
    })

    return { updated: activeCombos.length }
  },
)

export const generateDailyInsights = inngest.createFunction(
  { id: 'generate-daily-insights', triggers: [{ cron: '0 7,19 * * *' }] },
  async ({ step }) => {
    const activeUsers = await step.run('fetch-active-users', async () => {
      return prisma.user.findMany({
        where: {
          segmentSlug: { not: null },
          citySlug: { not: null },
          sessions: { some: { expiresAt: { gt: new Date() } } },
        },
        select: {
          id: true,
          businessName: true,
          segmentSlug: true,
          citySlug: true,
          targetAudience: true,
        },
      })
    })

    let generated = 0

    await step.run('generate-insights', async () => {
      for (const user of activeUsers) {
        if (
          !user.segmentSlug ||
          !user.citySlug ||
          !isValidSegmentSlug(user.segmentSlug) ||
          !isValidCitySlug(user.citySlug)
        ) continue

        const segment = getSegmentBySlug(user.segmentSlug as any)
        const city = getCityBySlug(user.citySlug as any)
        const audience = user.targetAudience
          ? getAudienceBySlug(user.targetAudience as any)
          : { label: 'Todos os públicos' }

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

        const existing = await prisma.aIInsight.findFirst({
          where: { userId: user.id, dataHash },
        })
        if (existing) continue

        try {
          const content = await generateInsights(input)
          await prisma.aIInsight.create({
            data: { userId: user.id, content: JSON.stringify(content), dataHash },
          })
          generated++
        } catch {
          // continua para o próximo usuário se a IA falhar
        }
      }
    })

    return { total: activeUsers.length, generated }
  },
)

export const syncBusinessProfiles = inngest.createFunction(
  { id: 'sync-business-profiles', triggers: [{ cron: '0 8 * * *' }] },
  async ({ step }) => {
    const usersWithBusiness = await step.run('fetch-users-with-business', async () => {
      return prisma.user.findMany({
        where: {
          businessName: { not: null },
          sessions: { some: { expiresAt: { gt: new Date() } } },
        },
        select: { id: true, businessName: true },
      })
    })

    let synced = 0

    await step.run('sync-profiles', async () => {
      for (const user of usersWithBusiness) {
        if (!user.businessName) continue
        try {
          const query = `${user.businessName} Teresina PI`
          await fetchBusinessProfile(user.id, query)
          synced++
        } catch {
          // continua para o próximo usuário
        }
      }
    })

    return { total: usersWithBusiness.length, synced }
  },
)
