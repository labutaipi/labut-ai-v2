import { base } from '@/server/orpc'
import { trendsRouter } from './trends'
import { onboardingRouter } from './onboarding'
import { userRouter } from './user'

export const appRouter = base.router({
  trends: base.router(trendsRouter),
  onboarding: base.router(onboardingRouter),
  user: base.router(userRouter),
})

export type AppRouter = typeof appRouter
