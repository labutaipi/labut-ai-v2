import { os, ORPCError } from '@orpc/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/server/db'

export const base = os.$context<{ headers: Headers }>().errors({
  BAD_REQUEST: {
    message: 'You are being rate limited',
  },
  NOT_FOUND: {
    message: 'Not found',
  },
  FORBIDDEN: {
    message: 'This is forbidden',
  },
  UNAUTHORIZED: {
    message: 'You are not authorized',
  },
  INTERNAL_SERVER_ERROR: {
    message: 'Something went wrong',
  },
})

export const publicProcedure = base

export const protectedProcedure = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers })
  if (!session) throw new ORPCError('UNAUTHORIZED')
  return next({ context: { ...context, session, userId: session.user.id } })
})

export const premiumProcedure = protectedProcedure.use(async ({ context, next }) => {
  const user = await prisma.user.findUnique({ where: { id: context.userId } })
  if (user?.plan !== 'PREMIUM') throw new ORPCError('FORBIDDEN')
  return next({ context })
})
