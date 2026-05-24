'use client'

import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { SEGMENTS } from '@/lib/segments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  const { data: session } = authClient.useSession()

  const howItWorks = [
    {
      num: '1',
      title: 'Crie sua conta',
      desc: 'Cadastro grátis com e-mail e senha. Sem cartão de crédito.',
    },
    {
      num: '2',
      title: 'Escolha seu segmento',
      desc: 'Selecione a área do seu negócio e a região onde atua em Teresina.',
    },
    {
      num: '3',
      title: 'Veja as tendências',
      desc: 'Acompanhe o que as pessoas buscam e aproveite as oportunidades.',
    },
  ]

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      {/* Hero */}
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-12 text-center sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <Badge variant="kicker" className="mb-3">Labut AI</Badge>
        <h1 className="display-title mx-auto mb-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-(--sea-ink) sm:text-5xl">
          O mercado de Teresina na palma da sua mão
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-(--sea-ink-soft) sm:text-lg">
          Do achismo à decisão inteligente: Transformando dados complexos em decisões simples para impulsionar pequenos negócios
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {session?.user ? (
            <Button asChild size="lg" className="rounded-full">
              <Link href="/dashboard">Ver meu painel →</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="rounded-full">
                <Link href="/sign-up">Criar conta grátis</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href="/sign-in">Já tenho conta</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Segmentos */}
      <section className="mt-12">
        <Badge variant="kicker" className="mb-3 block text-center">Segmentos disponíveis</Badge>
        <h2 className="mb-8 text-center text-2xl font-bold text-(--sea-ink)">
          Para o seu tipo de negócio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEGMENTS.map((segment, index) => (
            <article
              key={segment.slug}
              className="feature-card rise-in rounded-2xl bg-white p-6 dark:bg-foreground/10"
              style={{ animationDelay: `${index * 80 + 100}ms` }}
            >
              <span className="mb-3 block text-3xl">{segment.icon}</span>
              <h3 className="mb-2 text-base font-semibold text-(--sea-ink)">{segment.label}</h3>
              <p className="text-sm text-(--sea-ink-soft)">
                {segment.keywords.slice(0, 3).join(', ')} e mais
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="mt-16">
        <Badge variant="kicker" className="mb-3 block text-center">Como funciona</Badge>
        <h2 className="mb-8 text-center text-2xl font-bold text-(--sea-ink)">
          Em 3 passos simples
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.num} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#56c6be,#7ed3bf)] text-xl font-bold text-white shadow-lg">
                {step.num}
              </div>
              <h3 className="mb-2 font-semibold text-(--sea-ink)">{step.title}</h3>
              <p className="text-sm text-(--sea-ink-soft)">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-16 text-center">
        <div className="island-shell rounded-3xl px-8 py-12">
          <h2 className="display-title mb-4 text-2xl font-bold text-(--sea-ink) sm:text-3xl">
            Comece a entender seu mercado hoje
          </h2>
          <p className="mx-auto mb-8 max-w-md text-(--sea-ink-soft)">
            Gratuito, sem complicação. Feito para quem empreende sozinho no Piauí.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/sign-up">Criar conta grátis →</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
