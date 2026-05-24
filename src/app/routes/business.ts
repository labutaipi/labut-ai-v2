import * as z from 'zod'
import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'
import { fetchBusinessProfile } from '@/lib/serpapi/business'

export const businessRouter = {
  profile: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    return prisma.businessProfile.findUnique({
      where: { userId: context.userId },
      include: { reviews: { orderBy: { publishedAt: 'desc' }, take: 5 } },
    })
  }),

  sync: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { businessName: true, citySlug: true },
    })

    if (!user?.businessName) {
      throw new ORPCError('BAD_REQUEST', { message: 'Informe o nome do negócio no perfil.' })
    }

    const query = `${user.businessName} Teresina PI`
    return fetchBusinessProfile(context.userId, query, true)
  }),
}
