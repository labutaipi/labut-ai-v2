'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
      newUserCallbackURL: '/onboarding',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: form.email,
        password: form.password,
      })

      if (result.error) {
        toast.error('Credenciais inválidas.')
        return
      }
      setForm({ email: '', password: '' })
      router.push('/dashboard')
    } catch (err) {
      console.error('Erro ao entrar. Tente novamente:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn('flex flex-col gap-6 rounded-2xl bg-foreground/10', className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Esqueci minha senha
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </Field>
              <Field>
                <Button disabled={loading} type="submit">
                  Login
                </Button>
                <Button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  variant="outline"
                  type="button"
                >
                  Login com Google
                </Button>
                <FieldDescription className="text-center">
                  Não tem uma conta?{' '}
                  <Link href="/sign-up" className="no-underline hover:text-(--sea-ink)">
                    Crie uma conta
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
