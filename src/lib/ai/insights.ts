import crypto from 'crypto'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { groq, AI_MODEL } from './client'

export type InsightContent = {
  emAlta: string
  oportunidade: string
  acao: string
}

type InsightInput = {
  businessName: string | null
  segmentLabel: string
  cityLabel: string
  audienceLabel: string
  peak: number
  avg: number
  trend: 'up' | 'down' | 'neutral'
  risingQueries: string[]
}

const insightSchema = z.object({
  emAlta: z.string().describe('O que está em alta no mercado local para este segmento'),
  oportunidade: z.string().describe('Principal oportunidade detectada nos dados de tendência'),
  acao: z.string().describe('Ação concreta recomendada para o negócio aproveitar a tendência'),
})

export function hashInsightInput(input: InsightInput): string {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export async function generateInsights(input: InsightInput): Promise<InsightContent> {
  const trendLabel =
    input.trend === 'up' ? 'crescente' : input.trend === 'down' ? 'decrescente' : 'estável'
  const queries = input.risingQueries.slice(0, 5).join(', ') || 'nenhuma'

  const { output } = await generateText({
    model: groq(AI_MODEL),
    output: Output.object({ schema: insightSchema }),
    prompt: `Você é um analista de mercado local brasileiro. Analise os dados abaixo e gere insights práticos para o negócio.

Negócio: ${input.businessName ?? 'Não informado'}
Segmento: ${input.segmentLabel}
Cidade: ${input.cityLabel}
Público-alvo: ${input.audienceLabel}
Tendência de busca: ${trendLabel} (pico ${input.peak}, média ${input.avg})
Termos em alta: ${queries}`,
  })

  return output
}
