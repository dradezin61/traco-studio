"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";

/**
 * Item do menu com um filete embaixo: cheio na página atual, aparecendo no
 * hover nas demais. Nada fica se movendo sozinho.
 */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const caminho = usePathname();
  const ativo = caminho === href || caminho.startsWith(`${href}/`);

  return (
    <Link
      href={href as Route}
      aria-current={ativo ? "page" : undefined}
      className="group relative rounded-md px-3 py-2 text-sm transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className={ativo ? "text-foreground" : "text-muted transition-colors group-hover:text-foreground"}>
        {children}
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left bg-foreground transition-transform duration-[180ms] ease-out ${
          ativo ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}
