import type { Metadata } from "next";
import Link from "next/link";

import { btnSecondary, card, eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Pedido enviado" };

export default async function BriefingSentPage({ searchParams }: PageProps<"/orcamento/enviado">) {
  const { ref } = await searchParams;
  const referencia = typeof ref === "string" && /^TR-[A-Z0-9]{4}$/.test(ref) ? ref : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 sm:px-8">
      <p className={eyebrow}>Recebido</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight">Seu pedido chegou ao estúdio.</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Respondemos em até dois dias úteis, no e-mail que você informou.
      </p>

      {referencia ? (
        <div className={`${card} mt-8 p-6`}>
          <p className={eyebrow}>Código do pedido</p>
          <p className="mt-2 font-display text-3xl tracking-wide">{referencia}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Guarde este código: ele identifica a conversa se você quiser complementar alguma informação.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/projetos" className={btnSecondary}>
          Ver projetos
        </Link>
        <Link href="/" className={btnSecondary}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
