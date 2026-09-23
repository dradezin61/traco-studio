import type { Metadata } from "next";
import Link from "next/link";

import { btnPrimary, eyebrow } from "@/components/ui";
import { studio } from "@/lib/studio";

export const metadata: Metadata = { title: "Estúdio" };

export default function StudioPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8">
      <p className={eyebrow}>O estúdio</p>
      <h1 className="mt-5 max-w-[18ch] font-display text-[2.5rem] font-medium leading-[1.1] tracking-[-0.01em] sm:text-6xl">
        Desenhar é decidir o que fica de fora.
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="space-y-5 text-lg leading-relaxed">
          <p>
            O {studio.name} {studio.suffix} trabalha com projetos residenciais, comerciais e de interiores em{" "}
            {studio.city}. Cada projeto começa por uma conversa longa sobre rotina: quem usa o espaço, a que horas, com
            quem, fazendo o quê.
          </p>
          <p>
            Preferimos poucas decisões bem resolvidas a muitas soluções competindo entre si. Luz natural, circulação e
            materiais que envelhecem bem costumam resolver mais do que revestimento caro.
          </p>
          <p>
            Acompanhamos a obra até a entrega. O desenho que não sobrevive ao canteiro é redesenhado ali mesmo, com quem
            está executando.
          </p>
        </div>

        <aside className="space-y-6">
          <div className="border-t border-border/70 pt-4">
            <p className={eyebrow}>Atuação</p>
            <p className="mt-2">Residencial, comercial e interiores</p>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className={eyebrow}>Desde</p>
            <p className="mt-2">{studio.founded}</p>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className={eyebrow}>Onde</p>
            <p className="mt-2">{studio.city}</p>
          </div>

          <Link href="/orcamento" className={`${btnPrimary} w-full`}>
            Pedir orçamento
          </Link>
        </aside>
      </div>

      <p className="mt-16 border-t border-border/70 pt-6 text-sm text-muted">
        Estúdio e projetos fictícios, criados para demonstrar o sistema. As fotografias são de referência, de autores
        creditados no repositório, e não representam obras do estúdio.
      </p>
    </main>
  );
}
