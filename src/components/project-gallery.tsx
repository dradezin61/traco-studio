"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type GalleryImage = { url: string; alt: string };

/**
 * Sequência de fotografias do projeto. Clicar amplia em tela cheia, com
 * navegação por teclado (setas e Esc) e por botões.
 */
export function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const total = images.length;

  const mover = useCallback(
    (passo: number) => setAberta((atual) => (atual === null ? null : (atual + passo + total) % total)),
    [total],
  );

  useEffect(() => {
    if (aberta === null) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberta(null);
      if (evento.key === "ArrowRight") mover(1);
      if (evento.key === "ArrowLeft") mover(-1);
    };
    document.addEventListener("keydown", aoTeclar);
    // Trava a rolagem do fundo enquanto a foto está ampliada.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberta, mover]);

  if (total === 0) return null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {images.map((imagem, indice) => (
          <li key={imagem.url} className={indice === 0 ? "sm:col-span-2" : undefined}>
            <button
              type="button"
              onClick={() => setAberta(indice)}
              className="group relative block w-full overflow-hidden rounded-lg bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label={`Ampliar fotografia ${indice + 1} de ${total}: ${imagem.alt}`}
            >
              <div className={indice === 0 ? "aspect-3/2" : "aspect-4/5"}>
                <Image
                  src={imagem.url}
                  alt={imagem.alt}
                  fill
                  sizes={indice === 0 ? "(min-width: 1024px) 900px, 92vw" : "(min-width: 640px) 45vw, 92vw"}
                  className="object-cover transition-opacity group-hover:opacity-90"
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {aberta !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={images[aberta].alt}
          className="fixed inset-0 z-50 flex flex-col bg-foreground/95 p-4 sm:p-8"
          onClick={() => setAberta(null)}
        >
          <div className="flex items-center justify-between text-sm text-white/80">
            <span className="tabular-nums">
              {aberta + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setAberta(null)}
              className="rounded-full px-4 py-2 font-medium text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Fechar
            </button>
          </div>

          <div className="relative mt-4 flex-1" onClick={(evento) => evento.stopPropagation()}>
            <Image src={images[aberta].url} alt={images[aberta].alt} fill sizes="100vw" className="object-contain" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4" onClick={(evento) => evento.stopPropagation()}>
            <button
              type="button"
              onClick={() => mover(-1)}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Anterior
            </button>
            <p className="line-clamp-2 flex-1 text-center text-sm text-white/70">{images[aberta].alt}</p>
            <button
              type="button"
              onClick={() => mover(1)}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
