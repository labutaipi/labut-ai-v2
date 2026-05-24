import * as z from 'zod'
import { streamToEventIterator } from '@orpc/server'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { protectedProcedure } from '@/server/orpc'
import { groq, AI_MODEL } from '@/lib/ai/client'

type DashboardContext = {
  segmentLabel: string
  cityLabel: string
  businessName: string | null
  targetAudience: string | null
  peak: number
  avg: number
  trend: 'up' | 'down' | 'neutral'
  risingQueries: string[]
  topics: string[]
  neighborhoodTop: Array<{ name: string; opportunityScore: number }>
}

function buildSystemPrompt(ctx: DashboardContext): string {
  const trendLabel =
    ctx.trend === 'up' ? 'em alta 📈' : ctx.trend === 'down' ? 'em queda 📉' : 'estável ↔️'

  const neighborhoodText =
    ctx.neighborhoodTop.length > 0
      ? `- Bairros com maior oportunidade: ${ctx.neighborhoodTop.map((b) => `${b.name} (score ${b.opportunityScore}/100)`).join(', ')}`
      : ''

  return `Você é um consultor de mercado local especializado em pequenos negócios brasileiros.
Seu papel é ajudar o dono do negócio a entender os dados do painel e tomar decisões práticas.

DADOS DO PAINEL (Google Trends + Google Maps, atualizados automaticamente):
- Segmento: ${ctx.segmentLabel}
- Cidade: ${ctx.cityLabel}
- Nome do negócio: ${ctx.businessName ?? 'não informado'}
- Público-alvo: ${ctx.targetAudience ?? 'não informado'}
- Interesse de busca (últimos 90 dias): pico ${ctx.peak}/100, média ${ctx.avg}/100, tendência ${trendLabel}
- Buscas em alta: ${ctx.risingQueries.join(', ') || 'nenhuma identificada'}
- Tópicos relacionados em alta: ${ctx.topics.join(', ') || 'nenhum'}
${neighborhoodText}

COMO AGIR:
- Seja direto, prático e encorajador — como um consultor amigo
- Quando o usuário questionar os dados ("mas está caindo...", "tem muita concorrência..."), quebre a objeção usando os dados concretos acima
- Dê sempre um próximo passo claro e acionável baseado nos dados
- Seja conciso: máximo 3 parágrafos por resposta
- Use linguagem simples, sem jargão técnico
- Responda SEMPRE em português brasileiro`
}

export const chatRouter = {
  send: protectedProcedure
    .input(
      z.object({
        messages: z.array(z.any()),
        dashboardContext: z.any(),
      }),
    )
    .handler(async ({ input }) => {
      const messages = input.messages as UIMessage[]
      const ctx = input.dashboardContext as DashboardContext

      const result = streamText({
        model: groq(AI_MODEL),
        system: buildSystemPrompt(ctx),
        messages: await convertToModelMessages(messages),
      })

      return streamToEventIterator(result.toUIMessageStream())
    }),
}
