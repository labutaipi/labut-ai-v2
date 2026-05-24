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
import { maskCnpj, maskCep, isValidCnpj } from '@/utils/masks'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const saveOnboarding = useSaveOnboarding()

  const [step, setStep] = useState<Step>(1)
  const [segmentSlug, setSegmentSlug] = useState<SegmentSlug | null>(null)
  const [citySlug, setCitySlug] = useState<CitySlug | null>(null)
  const [audienceSlug, setAudienceSlug] = useState<AudienceSlug | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cep, setCep] = useState('')
  const [bairro, setBairro] = useState('')
  const [zona, setZona] = useState<'Norte' | 'Sul' | 'Leste' | 'Sudeste' | 'Centro' | null>(null)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjFilled, setCnpjFilled] = useState(false)

  async function handleCnpjChange(raw: string) {
    const masked = maskCnpj(raw)
    setCnpj(masked)
    setCnpjFilled(false)
    const digits = masked.replace(/\D/g, '')
    if (digits.length === 14 && isValidCnpj(digits)) {
      setCnpjLoading(true)
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
        if (res.ok) {
          const data = await res.json()
          if (!businessName) setBusinessName(data.razao_social ?? data.nome_fantasia ?? '')
          if (!cep) setCep(maskCep(data.cep ?? ''))
          if (!bairro) setBairro(data.bairro ?? '')
          setCnpjFilled(true)
        }
      } finally {
        setCnpjLoading(false)
      }
    }
  }

  async function handleFinish() {
    if (!segmentSlug || !citySlug) return
    await saveOnboarding.mutateAsync({
      segmentSlug,
      citySlug,
      audienceSlug: audienceSlug ?? undefined,
      businessName: businessName.trim(),
      cep: cep.trim() || undefined,
      bairro: bairro.trim() || undefined,
      zona: zona ?? undefined,
      cnpj: cnpj.trim() || undefined,
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
              Conte-nos sobre o seu negócio
            </h1>
            <p className="mb-8 text-(--sea-ink-soft)">
              Quanto mais informações, mais precisos serão os insights gerados.
            </p>

            <div className="space-y-4">
              {/* Nome do negócio — obrigatório */}
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Nome do negócio</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Salão da Maria"
                  className="h-11 rounded-xl"
                />
              </div>

              {/* CNPJ — opcional, auto-preenche dados */}
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">
                  CNPJ{' '}
                  <span className="text-xs font-normal text-(--sea-ink-soft)">(opcional — preenche os dados automaticamente)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cnpj"
                    type="text"
                    value={cnpj}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-11 rounded-xl pr-10"
                    inputMode="numeric"
                  />
                  {cnpjLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--sea-ink-soft)">
                      Buscando…
                    </span>
                  )}
                </div>
                {cnpjFilled && (
                  <p className="text-xs text-green-600">✓ Dados preenchidos automaticamente</p>
                )}
              </div>

              {/* CEP e Bairro lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cep">CEP <span className="text-xs font-normal text-(--sea-ink-soft)">(opcional)</span></Label>
                  <Input
                    id="cep"
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(maskCep(e.target.value))}
                    placeholder="64000-000"
                    className="h-11 rounded-xl"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bairro">Bairro <span className="text-xs font-normal text-(--sea-ink-soft)">(opcional)</span></Label>
                  <Input
                    id="bairro"
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Centro"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Zona de Teresina */}
              <div className="space-y-2">
                <Label>Zona <span className="text-xs font-normal text-(--sea-ink-soft)">(opcional)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {(['Norte', 'Sul', 'Leste', 'Sudeste', 'Centro'] as const).map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZona((prev) => (prev === z ? null : z))}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5',
                        zona === z
                          ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.12)] text-[var(--lagoon-deep)] shadow-[0_0_0_2px_var(--lagoon-deep)]'
                          : 'border-[var(--line)] bg-white/60 text-[var(--sea-ink)] hover:border-[rgba(50,143,151,0.4)] dark:bg-white/5',
                      )}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Label>Cidade</Label>
              <CityPicker selected={citySlug} onSelect={setCitySlug} />
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="h-11 rounded-xl">
                Voltar
              </Button>
              <Button
                onClick={() => citySlug && setStep(3)}
                disabled={!citySlug || businessName.trim().length < 2}
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
