'use client'

import { AUDIENCES, type AudienceSlug } from '@/lib/audiences'
import { cn } from '@/lib/utils'

interface AudiencePickerProps {
  selected: AudienceSlug | null
  onSelect: (slug: AudienceSlug) => void
}

export default function AudiencePicker({ selected, onSelect }: AudiencePickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {AUDIENCES.map((audience) => {
        const isSelected = selected === audience.slug
        return (
          <button
            key={audience.slug}
            type="button"
            onClick={() => onSelect(audience.slug)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-5 py-4 text-left transition hover:-translate-y-0.5',
              isSelected
                ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.12)] shadow-[0_0_0_2px_var(--lagoon-deep)]'
                : 'border-[var(--line)] bg-white/60 hover:border-[rgba(50,143,151,0.4)] dark:bg-white/5',
            )}
          >
            <span className="text-2xl">{audience.icon}</span>
            <span className="text-sm font-semibold text-[var(--sea-ink)]">{audience.label}</span>
          </button>
        )
      })}
    </div>
  )
}
