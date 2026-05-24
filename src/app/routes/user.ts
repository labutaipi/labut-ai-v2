import * as z from 'zod'
import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'

const userSelect = {
  id: true,
  name: true,
  email: true,
  businessName: true,
  segmentSlug: true,
  citySlug: true,
  targetAudience: true,
  plan: true,
} as const

export const userRouter = {
  me: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: userSelect,
    })
    if (!user) throw new ORPCError('NOT_FOUND')
    return user
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        businessName: z.string().min(2).optional(),
        targetAudience: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      return prisma.user.update({
        where: { id: context.userId },
        data: input,
        select: userSelect,
      })
    }),

  deleteAccount: protectedProcedure.input(z.object({})).handler(async ({ context }) => {
    await prisma.user.delete({ where: { id: context.userId } })
    return { success: true }
  }),
}
