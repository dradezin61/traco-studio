"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Aparição curta quando o elemento entra na tela, uma única vez.
 * O estado inicial é aplicado pelo próprio script: sem JavaScript, ou com
 * movimento reduzido, o conteúdo aparece normalmente desde o começo.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = alvo.current;
    if (!elemento) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    elemento.classList.add("entra");
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        elemento.classList.add("entra-visivel");
        observador.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={alvo} className={className}>
      {children}
    </div>
  );
}
