import 'server-only'
import { headers } from 'next/headers'
import { createRouterClient } from '@orpc/server'
import type { RouterClient } from '@orpc/server'
import { appRouter } from '@/app/routes'

declare global {
  var $client: RouterClient<typeof appRouter> | undefined
}

globalThis.$client = createRouterClient(appRouter, {
  context: async () => ({
    headers: await headers(),
  }),
})
