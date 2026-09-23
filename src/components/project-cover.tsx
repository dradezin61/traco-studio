import Image from "next/image";

import { publicImageUrl } from "@/lib/images";

type Props = {
  path: string | null;
  alt: string | null;
  title: string;
  sizes: string;
  /** Proporção do recorte; a galeria usa retrato, a abertura usa paisagem. */
  ratio?: "4/5" | "3/2" | "16/9";
  priority?: boolean;
  className?: string;
};

const ratios = { "4/5": "aspect-4/5", "3/2": "aspect-3/2", "16/9": "aspect-video" } as const;

/**
 * Fotografia do projeto, com o fundo pintado enquanto carrega. A moldura mantém
 * as dimensões: no hover, só a imagem cresce um pouco, dentro dela.
 */
export function ProjectCover({ path, alt, title, sizes, ratio = "4/5", priority = false, className = "" }: Props) {
  const url = publicImageUrl(path);
  const base = `relative w-full overflow-hidden bg-surface-muted ${ratios[ratio]} ${className}`;

  if (!url) {
    return (
      <div className={base} role="img" aria-label={`Sem fotografia de ${title}`}>
        <span className="absolute inset-0 grid place-items-center font-display text-3xl text-muted/50">{title.slice(0, 1)}</span>
      </div>
    );
  }

  return (
    <div className={base}>
      <Image
        src={url}
        alt={alt ?? title}
        fill
        sizes={sizes}
        quality={85}
        priority={priority}
        className="object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </div>
  );
}
