import * as z from 'zod'
import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'

export const userRouter = {
  me: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        segmentSlug: true,
        citySlug: true,
        plan: true,
      },
    })
    if (!user) throw new ORPCError('NOT_FOUND')
    return user
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        businessName: z.string().min(2).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      return prisma.user.update({
        where: { id: context.userId },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          businessName: true,
          segmentSlug: true,
          citySlug: true,
          plan: true,
        },
      })
    }),

  deleteAccount: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    await prisma.user.delete({ where: { id: context.userId } })
    return { success: true }
  }),
}
