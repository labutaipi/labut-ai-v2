'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import TrendChart from '@/components/charts/TrendChart'
import KpiCard from '@/components/dashboard/KpiCard'
import RelatedQueries from '@/components/dashboard/RelatedQueries'
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
import { orpc } from '@/lib/orpc'

type TimelineEntry = {
  date?: string
  values?: Array<{ query?: string; value?: string; extracted_value?: number }>
}

type TrendsPayload = {
  interest_over_time?: {
    timeline_data?: TimelineEntry[]
  }
  related_queries?: {
    rising?: Array<{ query?: string; value?: string }>
    top?: Array<{ query?: string; value?: string }>
  }
}

export function DashboardContent() {
  const router = useRouter()
  const { data: user } = useSuspenseQuery(orpc.user.me.queryOptions({ input: {} }))

  useEffect(() => {
    if (!user.segmentSlug || !user.citySlug) {
      router.push('/onboarding')
    }
  }, [user.segmentSlug, user.citySlug, router])

  if (!user.segmentSlug || !user.citySlug) return null

  const segment = getSegmentBySlug(user.segmentSlug as any)
  const city = getCityBySlug(user.citySlug as any)

  const { data: trends } = useSuspenseQuery(
    orpc.trends.get.queryOptions({
      input: {
        segmentSlug: user.segmentSlug,
        citySlug: user.citySlug,
      },
    }),
  )

  const trendsData = trends?.data as TrendsPayload | null
  const geoUsed = trends?.geoUsed as string | undefined
  const showFallbackWarning = geoUsed === 'BR-PI' && user.citySlug !== 'teresina'

  const timelineData = trendsData?.interest_over_time?.timeline_data ?? []
  const relatedQueries = trendsData?.related_queries?.rising ?? []

  const values = timelineData.flatMap(
    (d: TimelineEntry) =>
      d.values?.map((v: { extracted_value?: number }) => v.extracted_value ?? 0) ?? [],
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
        <h1 className="text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
          {segment.icon} {segment.label}{' '}
          <span className="text-[var(--sea-ink-soft)]">em {city.label}</span>
        </h1>
        {user.businessName && (
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{user.businessName}</p>
        )}
      </div>

      {showFallbackWarning && (
        <Alert variant="warning" className="mb-6">
          <span className="text-base">ℹ️</span>
          <AlertDescription>
            Exibindo dados do Piauí — sua cidade ainda tem poucos dados para análise
            individual.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Pico de interesse"
          value={`${peak}`}
          subtitle="nos últimos 90 dias"
          color="green"
        />
        <KpiCard
          label="Interesse médio"
          value={`${avg}`}
          subtitle="média do período"
          color="neutral"
        />
        <KpiCard
          label="Tendência atual"
          value={
            trend === 'up' ? 'Em alta' : trend === 'down' ? 'Em queda' : 'Estável'
          }
          subtitle="comparado à semana anterior"
          color={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'neutral'}
          arrow={trend}
        />
      </div>

      <Card className="mb-6 gap-0 py-0">
        <CardHeader className="px-6 pb-0 pt-6">
          <CardTitle>Interesse ao longo do tempo</CardTitle>
          <CardDescription>Últimos 90 dias — escala de 0 a 100</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          {timelineData.length > 0 ? (
            <TrendChart data={timelineData} keywords={segment.keywords} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-[var(--sea-ink-soft)]">
              Nenhum dado disponível para este período.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="px-6 pb-0 pt-6">
          <CardTitle>O que as pessoas estão buscando</CardTitle>
          <CardDescription>Buscas em alta relacionadas ao seu segmento</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          {relatedQueries.length > 0 ? (
            <RelatedQueries queries={relatedQueries} />
          ) : (
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Nenhuma busca relacionada encontrada.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
