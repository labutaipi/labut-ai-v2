'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client, orpc } from '@/lib/orpc'

export function useUser() {
  return useQuery(orpc.user.me.queryOptions({ input: {} }))
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; businessName?: string }) =>
      client.user.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.user.me.queryOptions({ input: {} }))
    },
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => client.user.deleteAccount({}),
  })
}
