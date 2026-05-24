import { Badge } from '@/components/ui/badge'

interface Topic {
  topic?: { title?: string; type?: string }
  value?: string
}

interface TopicsBadgesProps {
  data: { rising?: Topic[]; top?: Topic[] } | null
}

export default function TopicsBadges({ data }: TopicsBadgesProps) {
  const rising = data?.rising ?? []
  const top = data?.top ?? []
  const combined = [...rising, ...top].slice(0, 10)

  if (!combined.length) {
    return (
      <p className="text-sm text-[var(--sea-ink-soft)]">Nenhum tópico relacionado encontrado.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {combined.map((t, i) => {
        const title = t.topic?.title
        if (!title) return null
        const isBreakout = t.value === 'Breakout' || t.value === '+1000%' || t.value === 'Aumento repentino'
        return (
          <Badge
            key={i}
            variant={isBreakout ? 'default' : 'secondary'}
            className="rounded-full text-xs"
          >
            {isBreakout && '🔥 '}
            {title}
          </Badge>
        )
      })}
    </div>
  )
}
