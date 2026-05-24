import type { auth } from '@/lib/auth'

type Session = typeof auth.$Infer.Session

export async function getSessionInMiddleware(
  request: Request
): Promise<Session | null> {
  const sessionUrl = new URL('/api/auth/get-session', request.url)
  const res = await fetch(sessionUrl, {
    headers: { cookie: request.headers.get('cookie') ?? '' },
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}
