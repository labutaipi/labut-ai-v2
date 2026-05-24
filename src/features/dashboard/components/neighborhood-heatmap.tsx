'use client'

import type { NeighborhoodMapPayload } from '@/lib/serpapi/neighborhood'

interface Props {
  data: NeighborhoodMapPayload | null | undefined
}

function OpportunityBadge({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Alta oportunidade
      </span>
    )
  }
  if (score >= 40) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Moderado
      </span>
    )
  }
  return (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      Saturado
    </span>
  )
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-xs text-[var(--sea-ink-soft)]">—</span>
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="flex items-center gap-0.5 text-xs text-amber-500">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i}>★</span>
        if (i === full && half) return <span key={i} className="opacity-50">★</span>
        return <span key={i} className="opacity-20">★</span>
      })}
      <span className="ml-1 text-[var(--sea-ink-soft)]">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function NeighborhoodHeatmap({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-[var(--sea-ink-soft)]">
        Análise por bairro disponível apenas para Teresina.
      </p>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.businessCount), 1)

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div
          key={item.name}
          className="flex items-center gap-3 rounded-xl bg-white/40 px-4 py-3 dark:bg-white/5"
        >
          {/* Rank */}
          <span className="w-5 shrink-0 text-center text-xs font-bold text-[var(--sea-ink-soft)]">
            {i + 1}
          </span>

          {/* Nome + badge */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--sea-ink)]">{item.name}</span>
              <OpportunityBadge score={item.opportunityScore} />
            </div>
            <div className="mt-1.5 flex items-center gap-4">
              <RatingStars rating={item.avgRating} />
              <span className="text-xs text-[var(--sea-ink-soft)]">
                {item.businessCount} negócios encontrados
              </span>
            </div>
            {/* Competition bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--lagoon-deep)] transition-all"
                style={{ width: `${Math.round((item.businessCount / maxCount) * 100)}%` }}
              />
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 text-right">
            <span
              className="text-lg font-bold"
              style={{
                color:
                  item.opportunityScore >= 70
                    ? '#16a34a'
                    : item.opportunityScore >= 40
                      ? '#d97706'
                      : '#dc2626',
              }}
            >
              {item.opportunityScore}
            </span>
            <p className="text-[10px] text-[var(--sea-ink-soft)]">score</p>
          </div>
        </div>
      ))}

      <p className="pt-1 text-xs text-[var(--sea-ink-soft)]">
        Score combina baixa concorrência (60%) e clientes insatisfeitos (40%). Atualizado a cada 48h.
      </p>
    </div>
  )
}
