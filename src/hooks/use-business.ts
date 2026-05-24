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

export function useConfirmBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => client.business.confirm({}),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.business.profile.queryOptions({ input: {} }))
    },
  })
}

export function useRejectBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => client.business.reject({}),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.business.profile.queryOptions({ input: {} }))
    },
  })
}
