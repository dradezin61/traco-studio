import Link from "next/link";

import { signOut } from "@/app/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { studio } from "@/lib/studio";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="font-display text-2xl leading-none tracking-tight">{studio.name}</span>
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted">{studio.suffix}</span>
        </Link>

        <nav aria-label="Principal" className="order-3 flex items-center gap-1 sm:order-2">
          {[
            { href: "/projetos", label: "Projetos" },
            { href: "/estudio", label: "Estúdio" },
            ...(viewer?.isAdmin ? [{ href: "/painel", label: "Painel" }] : []),
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 flex items-center gap-2 sm:order-3">
          <Link href="/orcamento" className={btnPrimary}>
            Pedir orçamento
          </Link>
          {viewer ? (
            <form action={signOut}>
              <SubmitButton className={btnSecondary} pendingLabel="Saindo…">
                Sair
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
