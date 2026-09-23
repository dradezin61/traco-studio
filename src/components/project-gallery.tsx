"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryImage = { url: string; alt: string };

/**
 * Sequência de fotografias do projeto. Clicar amplia em tela cheia, com
 * navegação por teclado (setas e Esc) e por botões. Enquanto a foto ampliada
 * carrega, o vazio ganha uma varredura clara; ao fechar, o foco volta para a
 * miniatura de onde saiu.
 */
export function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const total = images.length;

  const miniaturas = useRef<(HTMLButtonElement | null)[]>([]);
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  /** De onde a ampliação partiu, para devolver o foco ao fechar. */
  const origem = useRef<number | null>(null);

  const abrir = (indice: number) => {
    origem.current = indice;
    setCarregando(true);
    setAberta(indice);
  };

  const mover = useCallback(
    (passo: number) =>
      setAberta((atual) => {
        if (atual === null) return null;
        setCarregando(true);
        return (atual + passo + total) % total;
      }),
    [total],
  );

  useEffect(() => {
    if (aberta === null) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberta(null);
        return;
      }
      if (evento.key === "ArrowRight") mover(1);
      if (evento.key === "ArrowLeft") mover(-1);
      if (evento.key !== "Tab" || !caixa.current) return;

      // Prende o foco: em tela cheia não há nada atrás para alcançar.
      const focaveis = caixa.current.querySelectorAll<HTMLElement>("button");
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar);
    // Trava a rolagem do fundo enquanto a foto está ampliada.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fechar.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberta, mover]);

  // Fechou: o foco volta para a miniatura que abriu a ampliação.
  useEffect(() => {
    if (aberta !== null || origem.current === null) return;
    miniaturas.current[origem.current]?.focus();
    origem.current = null;
  }, [aberta]);

  if (total === 0) return null;

  /** A primeira ocupa a largura toda; a última também, quando sobraria um vão. */
  const larga = (indice: number) => indice === 0 || (indice === total - 1 && (total - 1) % 2 === 1);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {images.map((imagem, indice) => (
          <li key={imagem.url} className={larga(indice) ? "sm:col-span-2" : undefined}>
            <button
              type="button"
              ref={(elemento) => {
                miniaturas.current[indice] = elemento;
              }}
              onClick={() => abrir(indice)}
              className="group relative block w-full overflow-hidden rounded-[10px] bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label={`Ampliar fotografia ${indice + 1} de ${total}: ${imagem.alt}`}
            >
              <div className={larga(indice) ? "aspect-3/2" : "aspect-4/5"}>
                <Image
                  src={imagem.url}
                  alt={imagem.alt}
                  fill
                  quality={85}
                  priority={indice === 0}
                  sizes={larga(indice) ? "(min-width: 1024px) 660px, 92vw" : "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 92vw"}
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {aberta !== null ? (
        <div
          ref={caixa}
          role="dialog"
          aria-modal="true"
          aria-label={images[aberta].alt}
          className="ampliada fixed inset-0 z-50 flex flex-col bg-foreground/95 p-4 sm:p-8"
          onClick={() => setAberta(null)}
        >
          <div className="flex items-center justify-between text-sm text-white/80">
            <span className="tabular-nums">
              {aberta + 1} / {total}
            </span>
            <button
              type="button"
              ref={fechar}
              onClick={() => setAberta(null)}
              className="rounded-full px-4 py-2 font-medium text-white transition-colors duration-[180ms] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Fechar
            </button>
          </div>

          <div
            className={`relative mt-4 flex-1 overflow-hidden ${carregando ? "carregando-foto" : ""}`}
            onClick={(evento) => evento.stopPropagation()}
          >
            <Image
              key={images[aberta].url}
              src={images[aberta].url}
              alt={images[aberta].alt}
              fill
              quality={85}
              sizes="100vw"
              onLoad={() => setCarregando(false)}
              className={`object-contain transition-opacity duration-[240ms] ease-out ${carregando ? "opacity-0" : "opacity-100"}`}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4" onClick={(evento) => evento.stopPropagation()}>
            <button
              type="button"
              onClick={() => mover(-1)}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors duration-[180ms] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Anterior
            </button>
            <p className="line-clamp-2 flex-1 text-center text-sm text-white/70">{images[aberta].alt}</p>
            <button
              type="button"
              onClick={() => mover(1)}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors duration-[180ms] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
