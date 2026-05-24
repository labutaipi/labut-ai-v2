"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/15 bg-(--header-bg) px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-(--chip-line) bg-(--chip-bg) px-0 py-0 text-sm text-(--sea-ink) no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-0 sm:py-0"
          >
            <img 
              src="LabutAI whitee.png" 
              alt="Labut AI" 
              className="h-8 w-auto object-contain max-w-none" 
              /* - Mudamos de h-12 para h-16 (ou h-20 se quiser ainda maior!).
                - Adicionamos 'max-w-none' para o Tailwind não tentar esmagar a largura da imagem.
              */
            />
          </Link>
        </h2>

        {session?.user && (
          <div className="order-3 flex w-full flex-wrap items-center gap-x-1 gap-y-1 pb-1 sm:order-0 sm:w-auto sm:flex-nowrap sm:pb-0">
            <Button
              variant="ghost"
              size="sm"
              asChild
              data-active={
                isActive("/dashboard") && !isActive("/dashboard/profile")
              }
              className="nav-link font-semibold"
            >
              <Link href="/dashboard">Painel</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              data-active={isActive("/dashboard/profile")}
              className="nav-link font-semibold"
            >
              <Link href="/dashboard/profile">Perfil</Link>
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {session?.user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-(--sea-ink-soft) sm:block">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-full"
              >
                <Link href="/sign-in">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full">
                <Link href="/sign-up">Criar conta</Link>
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
