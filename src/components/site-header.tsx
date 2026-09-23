import Link from "next/link";

import { signOut } from "@/app/auth-actions";
import { NavLink } from "@/components/nav-link";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { studio } from "@/lib/studio";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="group rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="font-display text-2xl font-semibold leading-none tracking-[-0.01em]">{studio.name}</span>
          <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition-colors group-hover:text-foreground">
            {studio.suffix}
          </span>
        </Link>

        <nav aria-label="Principal" className="order-3 flex items-center gap-1 sm:order-2">
          {[
            { href: "/projetos", label: "Projetos" },
            { href: "/estudio", label: "Estúdio" },
            ...(viewer?.isAdmin ? [{ href: "/painel", label: "Painel" }] : []),
          ].map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
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
