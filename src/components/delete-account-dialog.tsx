'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useDeleteAccount } from '@/hooks/use-user'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}

const STEPS = ['Consequências', 'Confirmação', 'Deleção final'] as const

export function DeleteAccountDialog({ open, onOpenChange, userEmail }: DeleteAccountDialogProps) {
  const router = useRouter()
  const deleteAccount = useDeleteAccount()
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const [checked, setChecked] = useState(false)

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1)
      setConfirmText('')
      setChecked(false)
    }, 300)
  }

  async function handleDelete() {
    await deleteAccount.mutateAsync()
    await authClient.signOut()
    router.push('/')
  }

  const stepTitles = ['Antes de continuar', 'Confirme sua identidade', 'Ação irreversível']

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-[440px]">
        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1
            const active = step === n
            const done = step > n
            return (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={
                    'flex size-6 items-center justify-center rounded-full text-xs font-bold transition-colors ' +
                    (done
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'bg-red-600 text-white'
                        : 'bg-[var(--line)] text-[var(--sea-ink-soft)]')
                  }
                >
                  {done ? '✓' : n}
                </div>
                <span className={`hidden text-xs sm:inline ${active ? 'font-medium text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)]'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-6 shrink-0 ${done ? 'bg-green-400' : 'bg-[var(--line)]'}`} />
                )}
              </div>
            )
          })}
        </div>

        <DialogHeader>
          <DialogTitle className={step === 3 ? 'text-red-600' : undefined}>
            {stepTitles[step - 1]}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Leia com atenção o que acontecerá ao deletar sua conta.'}
            {step === 2 && 'Para continuar, confirme digitando sua conta abaixo.'}
            {step === 3 && 'Não há como desfazer esta ação.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — consequences */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
              <p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
                Ao deletar sua conta:
              </p>
              <ul className="space-y-1.5 text-sm text-red-600 dark:text-red-400">
                <li>• Todos os seus dados serão permanentemente apagados</li>
                <li>• Seu histórico de análises e tendências será perdido</li>
                <li>• Seu perfil de negócio e palavras-chave serão removidos</li>
                <li>• Você perderá acesso imediato à plataforma</li>
                <li>• Não será possível recuperar nenhuma informação</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={() => setStep(2)}
              >
                Entendi, continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — type email */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-email">
                Digite{' '}
                <span className="font-semibold text-[var(--sea-ink)]">{userEmail}</span>{' '}
                para confirmar
              </Label>
              <Input
                id="confirm-email"
                type="email"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={userEmail}
                className="h-11 rounded-xl"
                autoComplete="off"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                disabled={confirmText.trim().toLowerCase() !== userEmail.toLowerCase()}
                onClick={() => setStep(3)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — final irreversible action */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-400">
                Você está prestes a deletar permanentemente a conta{' '}
                <span className="font-semibold">{userEmail}</span>. Essa ação{' '}
                <span className="font-bold uppercase">não pode ser desfeita</span>.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 size-4 accent-red-600"
              />
              <span className="text-sm text-[var(--sea-ink)]">
                Entendo que estou deletando minha conta para sempre e que não poderei recuperar meus dados.
              </span>
            </label>
            {deleteAccount.isError && (
              <p className="text-sm text-red-600">Erro ao deletar conta. Tente novamente.</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                disabled={!checked || deleteAccount.isPending}
                onClick={handleDelete}
              >
                {deleteAccount.isPending ? 'Deletando...' : 'Deletar minha conta'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
