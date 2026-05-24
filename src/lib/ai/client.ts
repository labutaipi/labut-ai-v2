import { createGroq } from '@ai-sdk/groq'

export const groq = createGroq({
  apiKey: process.env.AI_API_KEY,
})

export const AI_MODEL = process.env.AI_MODEL ?? 'llama-3.3-70b-versatile'
