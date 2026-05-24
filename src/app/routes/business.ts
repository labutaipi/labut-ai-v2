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
      select: { businessName: true, bairro: true, zona: true },
    })

    if (!user?.businessName) {
      throw new ORPCError('BAD_REQUEST', { message: 'Informe o nome do negócio no perfil.' })
    }

    const location = [user.bairro, user.zona, 'Teresina', 'PI'].filter(Boolean).join(', ')
    const query = `${user.businessName}, ${location}`
    return fetchBusinessProfile(context.userId, query, true)
  }),

  confirm: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: context.userId },
    })
    if (!profile) throw new ORPCError('NOT_FOUND', { message: 'Perfil não encontrado.' })
    return prisma.businessProfile.update({
      where: { userId: context.userId },
      data: { confirmed: true },
    })
  }),

  reject: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    await prisma.businessProfile.delete({ where: { userId: context.userId } })
    return { success: true }
  }),
}
