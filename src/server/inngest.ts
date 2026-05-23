import { Inngest } from 'inngest'
import { prisma } from '@/server/db'
import { fetchSegmentTrends } from '@/lib/serpapi/trends'

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
