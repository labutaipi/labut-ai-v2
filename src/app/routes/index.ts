import { base } from '@/server/orpc'
import { trendsRouter } from './trends'
import { onboardingRouter } from './onboarding'
import { userRouter } from './user'
import { insightsRouter } from './insights'
import { businessRouter } from './business'

export const appRouter = base.router({
  trends: base.router(trendsRouter),
  onboarding: base.router(onboardingRouter),
  user: base.router(userRouter),
  insights: base.router(insightsRouter),
  business: base.router(businessRouter),
})

export type AppRouter = typeof appRouter
