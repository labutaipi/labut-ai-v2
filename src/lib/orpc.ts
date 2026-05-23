import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { appRouter } from '@/server/routers'

declare global {
  var $client: RouterClient<typeof appRouter> | undefined
}

const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') throw new Error('RPCLink não permitido no servidor.')
    return `${window.location.origin}/rpc`
  },
})

export const client: RouterClient<typeof appRouter> =
  globalThis.$client ?? createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
