'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import TrendChart from '@/features/dashboard/components/trend-chart'
import KpiCard from '@/features/dashboard/components/kpi-card'
import RelatedQueries from '@/features/dashboard/components/related-queries'
import RegionMap from '@/features/dashboard/components/region-map'
import TopicsBadges from '@/features/dashboard/components/topics-badges'
import InsightCard from '@/features/dashboard/components/insight-card'
import BusinessCard from '@/features/dashboard/components/business-card'
import NeighborhoodHeatmap from '@/features/dashboard/components/neighborhood-heatmap'
import { ChatSheet } from '@/features/dashboard/components/chat-sheet'
import { InfoTooltip } from '@/components/info-tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCityBySlug } from '@/lib/cities'
import { getSegmentBySlug } from '@/lib/segments'
import { useUser } from '@/hooks/use-user'
import {
  useTrends,
  useTrendsByRegion,
  useTrendTopics,
  useNeighborhoodMap,
} from '@/features/dashboard/hooks/use-trends'
import { DashboardSkeleton } from './dashboard-skeleton'

type TimelineEntry = {
  date?: string
  values?: Array<{ query?: string; value?: string; extracted_value?: number }>
}

export function DashboardContent() {
  const router = useRouter()

  const { data: user, isLoading: userLoading } = useUser()

  const trendsInput =
    user?.segmentSlug && user?.citySlug
      ? { segmentSlug: user.segmentSlug, citySlug: user.citySlug }
      : null

  const { data: trends, isLoading: trendsLoading } = useTrends(trendsInput)
  const { data: byRegion } = useTrendsByRegion(trendsInput)
  const { data: topics } = useTrendTopics(trendsInput)
  const { data: neighborhood } = useNeighborhoodMap(trendsInput)

  useEffect(() => {
    if (user && (!user.segmentSlug || !user.citySlug)) {
      router.push('/onboarding')
    }
  }, [user, router])

  if (userLoading || trendsLoading) return <DashboardSkeleton />
  if (!user || !user.segmentSlug || !user.citySlug) return null

  const segment = getSegmentBySlug(user.segmentSlug as any)
  const city = getCityBySlug(user.citySlug as any)

  const geoUsed = trends?.geoUsed as string | undefined
  const showFallbackWarning =
    geoUsed === 'BR-PI' && user.citySlug !== 'teresina'

  const timelineData = (trends?.data as any)?.timeline_data ?? []
  const relatedQueries = (trends?.data as any)?.related_queries?.rising ?? []

  const values: number[] = timelineData.flatMap(
    (d: TimelineEntry) =>
      d.values?.map(
        (v: { extracted_value?: number }) => v.extracted_value ?? 0,
      ) ?? [],
  )
  const peak = values.length ? Math.max(...values) : 0
  const avg = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0
  const last = values.at(-1) ?? 0
  const prev = values.at(-2) ?? last
  const trend = last > prev ? 'up' : last < prev ? 'down' : 'neutral'

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <div className="mb-8">
        <Badge variant="kicker" className="mb-1">
          Seu painel de mercado
        </Badge>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-(--sea-ink) sm:text-3xl">
            {segment.icon} {segment.label}{' '}
            <span className="text-(--sea-ink-soft)">em {city.label}</span>
          </h1>
          <ChatSheet
            context={{
              segmentLabel: segment.label,
              cityLabel: city.label,
              businessName: user.businessName ?? null,
              targetAudience: user.targetAudience ?? null,
              peak,
              avg,
              trend,
              risingQueries: relatedQueries
                .map((q: any) => q.query ?? '')
                .filter(Boolean)
                .slice(0, 8),
              topics: [
                ...((topics?.data as any)?.rising ?? []).map((t: any) => t.topic?.title ?? ''),
                ...((topics?.data as any)?.top ?? []).map((t: any) => t.topic?.title ?? ''),
              ]
                .filter(Boolean)
                .slice(0, 8),
              neighborhoodTop: ((neighborhood?.data as any) ?? []).slice(0, 5),
            }}
          />
        </div>
        {user.businessName && (
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            {user.businessName}
          </p>
        )}
      </div>

      {showFallbackWarning && (
        <Alert variant="warning" className="mb-6">
          <span className="text-base">ℹ️</span>
          <AlertDescription>
            Exibindo dados do Piauí — sua cidade ainda tem poucos dados para
            análise individual.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Pico de interesse"
          value={`${peak}`}
          subtitle="nos últimos 90 dias"
          color="green"
          tooltip="O maior valor de interesse registrado no período. Fonte: Google Trends. Escala de 0 a 100 — 100 representa o momento de maior busca pelo segmento."
        />
        <KpiCard
          label="Interesse médio"
          value={`${avg}`}
          subtitle="média do período"
          color="neutral"
          tooltip="Média aritmética de todos os pontos da série histórica dos últimos 90 dias. Fonte: Google Trends via SerpAPI."
        />
        <KpiCard
          label="Tendência atual"
          value={
            trend === 'up'
              ? 'Em alta'
              : trend === 'down'
                ? 'Em queda'
                : 'Estável'
          }
          subtitle="comparado à semana anterior"
          color={
            trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'neutral'
          }
          arrow={trend}
          tooltip="Compara o último ponto da série com o penúltimo. Se o interesse desta semana for maior que o da anterior, a tendência é 'Em alta'. Fonte: Google Trends."
        />
      </div>

      <Card className="mb-6 gap-0 py-0">
        <CardHeader className="px-6 pb-0 pt-6">
          <div className="flex items-center gap-2">
            <CardTitle>Interesse ao longo do tempo</CardTitle>
            <InfoTooltip text="Fonte: Google Trends via SerpAPI. Mostra o volume relativo de buscas pelas palavras-chave do seu segmento. A escala vai de 0 a 100, onde 100 representa o maior pico de interesse no período." />
          </div>
          <CardDescription>Últimos 90 dias — escala de 0 a 100</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          {timelineData.length > 0 ? (
            <TrendChart data={timelineData} keywords={segment.keywords} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-(--sea-ink-soft)">
              Nenhum dado disponível para este período.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6">
        <InsightCard />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <CardTitle>
                {neighborhood?.data?.length ? 'Oportunidade por bairro' : 'Interesse por região'}
              </CardTitle>
              <InfoTooltip
                text={
                  neighborhood?.data?.length
                    ? 'Fonte: Google Maps via SerpAPI. Buscamos o seu segmento nas coordenadas de cada bairro de Teresina. Contamos os negócios e calculamos a média de avaliações. Score = baixa concorrência (60%) + clientes insatisfeitos (40%). Atualizado a cada 48h.'
                    : 'Fonte: Google Trends (GEO_MAP) via SerpAPI. Compara o interesse relativo pelo seu segmento entre as regiões do Piauí. Quanto maior a barra, maior a concentração de buscas naquela região.'
                }
              />
            </div>
            <CardDescription>
              {neighborhood?.data?.length
                ? 'Saturação e potencial de mercado por bairro'
                : 'Onde as pessoas mais buscam seu segmento'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {neighborhood?.data?.length ? (
              <NeighborhoodHeatmap data={neighborhood.data as any} />
            ) : (
              <RegionMap data={(byRegion?.data as any) ?? null} />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <CardTitle>Tópicos relacionados</CardTitle>
              <InfoTooltip text="Fonte: Google Trends (RELATED_TOPICS) via SerpAPI. São assuntos que o Google identifica como fortemente associados às buscas do seu segmento. 'Em alta' significa crescimento recente de interesse." />
            </div>
            <CardDescription>Assuntos em alta no seu segmento</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            <TopicsBadges data={(topics?.data as any) ?? null} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <CardTitle>O que as pessoas estão buscando</CardTitle>
              <InfoTooltip text="Fonte: Google Trends (RELATED_QUERIES) via SerpAPI. São termos de busca reais que cresceram junto com as palavras-chave do seu segmento nos últimos 90 dias." />
            </div>
            <CardDescription>
              Buscas em alta relacionadas ao seu segmento
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {relatedQueries.length > 0 ? (
              <RelatedQueries queries={relatedQueries} />
            ) : (
              <p className="text-sm text-(--sea-ink-soft)">
                Nenhuma busca relacionada encontrada.
              </p>
            )}
          </CardContent>
        </Card>

        <BusinessCard businessName={user.businessName} />
      </div>

    </main>
  )
}
