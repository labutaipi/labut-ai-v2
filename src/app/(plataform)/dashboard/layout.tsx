import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery(orpc.user.me.queryOptions({ input: {} }))
  const user = queryClient.getQueryData(
    orpc.user.me.queryOptions({ input: {} }).queryKey,
  ) as { segmentSlug?: string | null; citySlug?: string | null } | undefined

  if (!user) redirect('/sign-in')

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
