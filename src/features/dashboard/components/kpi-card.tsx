import { Card, CardContent } from '@/components/ui/card'
import { InfoTooltip } from '@/components/info-tooltip'
import { cn } from '@/lib/utils'

type Color = 'green' | 'red' | 'neutral' | 'orange'
type Arrow = 'up' | 'down' | 'neutral'

interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  color?: Color
  arrow?: Arrow
  tooltip?: string
}

const colorMap: Record<Color, string> = {
  green: '#16A34A',
  red: '#DC2626',
  neutral: '#6B7280',
  orange: '#EA580C',
}

export default function KpiCard({ label, value, subtitle, color = 'neutral', arrow, tooltip }: KpiCardProps) {
  return (
    <Card className="gap-2 py-5">
      <CardContent className="px-5">
        <div className="mb-2 flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
            {label}
          </p>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold"
            style={{ color: colorMap[color] }}
          >
            {value}
          </span>
          {arrow && arrow !== 'neutral' && (
            <span
              className={cn('text-lg font-bold')}
              style={{ color: colorMap[arrow === 'up' ? 'green' : 'red'] }}
            >
              {arrow === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
