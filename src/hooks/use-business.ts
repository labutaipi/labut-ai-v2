'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpc, client } from '@/lib/orpc'

export function useBusinessProfile() {
  return useQuery(orpc.business.profile.queryOptions({ input: {} }))
}

export function useSyncBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => client.business.sync({}),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.business.profile.queryOptions({ input: {} }))
    },
  })
}
