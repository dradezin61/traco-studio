"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Malha de desenho: duas famílias de linhas diagonais que deslizam sem parar,
 * como a prancheta ainda em uso atrás do título. O ciclo avança exatamente um
 * módulo do padrão, então a emenda não aparece em nenhuma largura de tela.
 *
 * A camada é decorativa — fica fora da árvore acessível e não recebe cliques.
 * O movimento para sozinho quando a abertura sai da tela ou a aba é escondida,
 * e o controle ao lado deixa parar de vez; a escolha manual vale mais que a
 * automática. Com movimento reduzido, o desenho fica montado e parado.
 */
export function MotionGrid() {
  const area = useRef<HTMLDivElement>(null);
  const [escolha, setEscolha] = useState<"correndo" | "parado">("correndo");
  const [naTela, setNaTela] = useState(true);
  const [abaVisivel, setAbaVisivel] = useState(true);

  useEffect(() => {
    const elemento = area.current;
    if (!elemento) return;

    const observador = new IntersectionObserver(([entrada]) => setNaTela(entrada.isIntersecting), {
      threshold: 0,
    });
    observador.observe(elemento);

    const aoTrocarDeAba = () => setAbaVisivel(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", aoTrocarDeAba);

    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", aoTrocarDeAba);
    };
  }, []);

  const parado = escolha === "parado" || !naTela || !abaVisivel;

  return (
    <>
      <div ref={area} aria-hidden="true" className="malha" data-parado={parado ? "sim" : "nao"}>
        <span className="malha-camada malha-camada-fina" />
        <span className="malha-camada malha-camada-traco" />
      </div>

      <button
        type="button"
        onClick={() => setEscolha((atual) => (atual === "parado" ? "correndo" : "parado"))}
        className="malha-controle absolute bottom-4 right-5 z-10 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-[2px] transition-colors duration-[180ms] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:bottom-6 sm:right-8"
      >
        {escolha === "parado" ? "Retomar fundo" : "Pausar fundo"}
      </button>
    </>
  );
}
