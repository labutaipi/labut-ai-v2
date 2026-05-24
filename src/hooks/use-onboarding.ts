'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client, orpc } from '@/lib/orpc'

export function useSaveOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      segmentSlug: string
      citySlug: string
      audienceSlug?: string
      businessName?: string
    }) => client.onboarding.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.user.me.queryOptions({ input: {} }))
    },
  })
}
