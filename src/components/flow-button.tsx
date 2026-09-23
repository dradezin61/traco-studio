"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, PointerEvent, ReactNode } from "react";
import { useState } from "react";

type Variante = "principal" | "secundaria";

/**
 * Seta do movimento: a da direita sai, a da esquerda entra. Decorativa — o
 * nome acessível do botão é o texto, e repetir isso no ícone só atrapalharia
 * quem usa leitor de tela.
 */
function Seta({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12h15m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * No ponteiro o efeito vem do `:hover`; no teclado, do foco. No toque não há
 * nem um nem outro antes da navegação começar, então a pressão é marcada aqui
 * — uma troca de estado por toque, não por quadro.
 */
function usePressionado() {
  const [pressionado, setPressionado] = useState(false);
  const soltar = () => setPressionado(false);
  return {
    pressionado,
    handlers: {
      onPointerDown: (evento: PointerEvent) => {
        if (evento.pointerType !== "mouse") setPressionado(true);
      },
      onPointerUp: soltar,
      onPointerCancel: soltar,
      onPointerLeave: soltar,
    },
  };
}

function conteudo(children: ReactNode) {
  return (
    <>
      {/* Preenchimento circular, atrás do texto. */}
      <span aria-hidden="true" className="fluxo-circulo" />
      <Seta className="fluxo-seta fluxo-seta-entra" />
      <span className="fluxo-texto">{children}</span>
      <Seta className="fluxo-seta fluxo-seta-sai" />
    </>
  );
}

const classes = (variante: Variante, pressionado: boolean, className: string) =>
  ["fluxo", variante === "principal" ? "fluxo-principal" : "fluxo-secundaria", pressionado ? "fluxo-pressionado" : "", className]
    .filter(Boolean)
    .join(" ");

/** Chamada que leva a outra página. Continua sendo um link de verdade. */
export function FlowLink({
  href,
  children,
  variante = "principal",
  className = "",
  ...resto
}: {
  href: string;
  children: ReactNode;
  variante?: Variante;
  className?: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">) {
  const { pressionado, handlers } = usePressionado();
  return (
    <Link href={href as Route} className={classes(variante, pressionado, className)} {...handlers} {...resto}>
      {conteudo(children)}
    </Link>
  );
}

/** Mesma aparência para ações. `type="button"` por padrão, como manda o hábito. */
export function FlowButton({
  children,
  variante = "principal",
  className = "",
  type = "button",
  ...resto
}: {
  children: ReactNode;
  variante?: Variante;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pressionado, handlers } = usePressionado();
  return (
    <button type={type} className={classes(variante, pressionado, className)} {...handlers} {...resto}>
      {conteudo(children)}
    </button>
  );
}
