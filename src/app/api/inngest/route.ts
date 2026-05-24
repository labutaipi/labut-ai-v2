import { serve } from 'inngest/next'
import {
  inngest,
  updateTrendsCache,
  generateDailyInsights,
  syncBusinessProfiles,
} from '@/server/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [updateTrendsCache, generateDailyInsights, syncBusinessProfiles],
})
