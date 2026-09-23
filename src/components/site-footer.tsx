import Link from "next/link";

import { author, studio } from "@/lib/studio";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          <span className="font-display text-base text-foreground">
            {studio.name} {studio.suffix}
          </span>
          <span className="ml-3">
            {studio.tagline} · {studio.city}
          </span>
        </p>

        <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link href="/orcamento" className="underline underline-offset-4 hover:text-foreground">
            Pedir orçamento
          </Link>
          <a href={author.portfolio} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
            Desenvolvido por {author.name}
          </a>
          <a href={author.repository} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
