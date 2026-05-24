import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-4 shrink-0 cursor-default items-center justify-center rounded-full border border-[var(--sea-ink-soft)] text-[9px] font-bold leading-none text-[var(--sea-ink-soft)] opacity-60 transition-opacity hover:opacity-100 focus:outline-none"
          aria-label="Mais informações"
        >
          i
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}
