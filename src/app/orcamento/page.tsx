import type { Metadata } from "next";

import { BriefingForm } from "@/components/briefing-form";
import { Flash } from "@/components/flash";
import { eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Pedir orçamento" };

export default async function BriefingPage({ searchParams }: PageProps<"/orcamento">) {
  const { erro } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
      <p className={eyebrow}>Orçamento</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Conte sobre o seu espaço.</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
        Quatro passos rápidos. Respondemos em até dois dias úteis com uma primeira conversa e uma estimativa de prazo.
      </p>

      <div className="mt-6">
        <Flash erro={typeof erro === "string" ? erro : undefined} />
      </div>

      <BriefingForm />
    </main>
  );
}
