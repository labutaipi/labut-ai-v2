import { serve } from 'inngest/next'
import { inngest, updateTrendsCache } from '@/server/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [updateTrendsCache],
})
