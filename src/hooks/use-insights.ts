'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpc, client } from '@/lib/orpc'

export function useLatestInsight() {
  return useQuery(orpc.insights.latest.queryOptions({ input: {} }))
}

export function useGenerateInsight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => client.insights.generate({}),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.insights.latest.queryOptions({ input: {} }))
    },
  })
}
