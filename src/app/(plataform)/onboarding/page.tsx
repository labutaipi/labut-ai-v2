'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SegmentPicker from '@/components/onboarding/segment-picker'
import CityPicker from '@/components/onboarding/city-picker'
import AudiencePicker from '@/components/onboarding/audience-picker'
import type { SegmentSlug } from '@/lib/segments'
import type { CitySlug } from '@/lib/cities'
import type { AudienceSlug } from '@/lib/audiences'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSaveOnboarding } from '@/hooks/use-onboarding'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const saveOnboarding = useSaveOnboarding()

  const [step, setStep] = useState<Step>(1)
  const [segmentSlug, setSegmentSlug] = useState<SegmentSlug | null>(null)
  const [citySlug, setCitySlug] = useState<CitySlug | null>(null)
  const [audienceSlug, setAudienceSlug] = useState<AudienceSlug | null>(null)
  const [businessName, setBusinessName] = useState('')

  async function handleFinish() {
    if (!segmentSlug || !citySlug) return
    await saveOnboarding.mutateAsync({
      segmentSlug,
      citySlug,
      audienceSlug: audienceSlug ?? undefined,
      businessName: businessName.trim() || undefined,
    })
    router.push('/dashboard')
  }

  return (
    <main className="page-wrap flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 flex-1 rounded-full transition-all',
                step >= s ? 'bg-(--lagoon-deep)' : 'bg-(--line)',
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <Badge variant="kicker" className="mb-3">Passo 1 de 3</Badge>
            <h1 className="display-title mb-2 text-3xl font-bold text-(--sea-ink)">
              Qual é o seu segmento?
            </h1>
            <p className="mb-8 text-(--sea-ink-soft)">
              Escolha a área do seu negócio para ver as tendências certas.
            </p>
            <SegmentPicker selected={segmentSlug} onSelect={setSegmentSlug} />
            <Button
              onClick={() => segmentSlug && setStep(2)}
              disabled={!segmentSlug}
              className="mt-8 h-11 w-full rounded-xl"
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <Badge variant="kicker" className="mb-3">Passo 2 de 3</Badge>
            <h1 className="display-title mb-2 text-3xl font-bold text-(--sea-ink)">
              Em qual cidade você atende?
            </h1>
            <p className="mb-8 text-(--sea-ink-soft)">
              Vamos mostrar as tendências da sua cidade no Piauí.
            </p>
            <div className="mb-6 space-y-1.5">
              <Label htmlFor="businessName">Nome do seu negócio (opcional)</Label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Salão da Maria"
                className="h-11 rounded-xl"
              />
            </div>
            <CityPicker selected={citySlug} onSelect={setCitySlug} />
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="h-11 rounded-xl">
                Voltar
              </Button>
              <Button
                onClick={() => citySlug && setStep(3)}
                disabled={!citySlug}
                className="h-11 flex-1 rounded-xl"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <Badge variant="kicker" className="mb-3">Passo 3 de 3</Badge>
            <h1 className="display-title mb-2 text-3xl font-bold text-(--sea-ink)">
              Qual é o seu público-alvo?
            </h1>
            <p className="mb-8 text-(--sea-ink-soft)">
              Isso ajuda a IA a gerar insights mais precisos para o seu negócio.
            </p>
            <AudiencePicker selected={audienceSlug} onSelect={setAudienceSlug} />

            {saveOnboarding.isError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>Erro ao salvar. Tente novamente.</AlertDescription>
              </Alert>
            )}

            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="h-11 rounded-xl">
                Voltar
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saveOnboarding.isPending}
                className="h-11 flex-1 rounded-xl"
              >
                {saveOnboarding.isPending ? 'Salvando...' : 'Ver meu painel'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
