'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { eventIteratorToUnproxiedDataStream } from '@orpc/client'
import { type ChatTransport, type UIMessage } from 'ai'
import { Send } from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/orpc'
import { cn } from '@/lib/utils'

export type DashboardContext = {
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

interface Props {
  context: DashboardContext
}

function trendEmoji(trend: DashboardContext['trend']) {
  return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '↔️'
}

function WelcomeMessage({ context }: { context: DashboardContext }) {
  const queries = context.risingQueries.slice(0, 3).join(', ')
  return (
    <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-[var(--sea-ink)] shadow-sm dark:bg-white/10">
      <p className="font-medium text-[var(--lagoon-deep)]">Olá! Sou seu consultor de mercado 👋</p>
      <p className="mt-1.5 text-[var(--sea-ink)]">
        Analisei os dados de <strong>{context.segmentLabel}</strong> em{' '}
        <strong>{context.cityLabel}</strong>. Seu mercado está{' '}
        <strong>{trend(context.trend)} {trendEmoji(context.trend)}</strong> com interesse médio de{' '}
        <strong>{context.avg}/100</strong> (pico: <strong>{context.peak}</strong>).
        {queries ? ` As buscas mais quentes são: ${queries}.` : ''}
      </p>
      <p className="mt-1.5 text-[var(--sea-ink-soft)]">
        Pergunte o que quiser sobre esses dados — vou ajudar a quebrar objeções e traçar sua estratégia. 💬
      </p>
    </div>
  )
}

function trend(t: DashboardContext['trend']) {
  return t === 'up' ? 'em alta' : t === 'down' ? 'em queda' : 'estável'
}

export function ChatSheet({ context }: Props) {
  const contextRef = useRef(context)
  contextRef.current = context

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const transport = useMemo<ChatTransport<UIMessage>>(
    () => ({
      async sendMessages({ messages, abortSignal }) {
        const iterator = await client.chat.send(
          { messages, dashboardContext: contextRef.current },
          { signal: abortSignal ?? undefined },
        )
        return eventIteratorToUnproxiedDataStream(iterator) as ReadableStream<any>
      },
      async reconnectToStream() {
        return null
      },
    }),
    [],
  )

  const { messages, sendMessage, status } = useChat({ transport })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || status === 'streaming' || status === 'submitted') return
    sendMessage({ text })
    setInput('')
  }

  const isBusy = status === 'streaming' || status === 'submitted'

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-base"
          aria-label="Abrir assistente de mercado"
        >
          💬
        </Button>
      </SheetTrigger>
      <SheetContent title="Assistente de mercado">
        {/* Messages area */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--surface,#f4f8f8)] px-4 py-4 dark:bg-[#0a1e20]">
          <WelcomeMessage context={context} />

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-[var(--lagoon-deep)] text-white'
                    : 'rounded-tl-sm bg-white text-[var(--sea-ink)] dark:bg-white/10',
                )}
              >
                {(message.parts as UIMessage['parts']).map((part, i) =>
                  part.type === 'text' ? (
                    <span key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          ))}

          {/* Typing dots — só enquanto aguarda o primeiro token */}
          {status === 'submitted' && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm dark:bg-white/10">
                <span className="inline-flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-1.5 animate-bounce rounded-full bg-[var(--sea-ink-soft)]"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 items-center gap-2 border-t border-[var(--line)] bg-white px-4 py-3 dark:bg-[#0f2325]"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre seus dados..."
            className="h-10 flex-1 rounded-xl"
            disabled={isBusy}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            disabled={!input.trim() || isBusy}
            aria-label="Enviar"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
