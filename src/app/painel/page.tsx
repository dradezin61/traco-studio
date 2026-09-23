import type { Metadata } from "next";
import Link from "next/link";

import { Flash } from "@/components/flash";
import { card, eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Painel" };

type Briefing = {
  id: string;
  reference: string;
  name: string;
  environment_type: string;
  deadline: string;
  status: "recebido" | "em_analise" | "respondido";
  notify_status: "pendente" | "enviado" | "falhou";
  created_at: string;
};

const rotulos = { recebido: "Recebido", em_analise: "Em análise", respondido: "Respondido" } as const;
const estilos = {
  recebido: "border-accent/40 bg-accent/10 text-accent",
  em_analise: "border-brand/30 bg-brand-soft text-brand",
  respondido: "border-success/30 bg-success-soft text-success",
} as const;

const data = (valor: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(
    new Date(valor),
  );

export default async function PanelPage({ searchParams }: PageProps<"/painel">) {
  const viewer = await requireAdmin();
  const query = await searchParams;

  const supabase = await createClient();
  const { data: lista } = await supabase
    .from("briefings")
    .select("id, reference, name, environment_type, deadline, status, notify_status, created_at")
    .order("created_at", { ascending: false })
    .returns<Briefing[]>();
  const briefings = lista ?? [];

  const contagem = {
    recebido: briefings.filter((b) => b.status === "recebido").length,
    em_analise: briefings.filter((b) => b.status === "em_analise").length,
    respondido: briefings.filter((b) => b.status === "respondido").length,
    falhas: briefings.filter((b) => b.notify_status === "falhou").length,
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8">
      <p className={eyebrow}>Painel do estúdio</p>
      <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Pedidos de orçamento</h1>
      <p className="mt-2 text-muted">Acesso de {viewer.name}.</p>

      <div className="mt-6">
        <Flash
          ok={typeof query.ok === "string" ? query.ok : undefined}
          erro={typeof query.erro === "string" ? query.erro : undefined}
        />
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { termo: "Recebidos", valor: contagem.recebido },
          { termo: "Em análise", valor: contagem.em_analise },
          { termo: "Respondidos", valor: contagem.respondido },
          { termo: "Avisos falhados", valor: contagem.falhas },
        ].map((item) => (
          <div key={item.termo} className={`${card} p-4`}>
            <dt className={eyebrow}>{item.termo}</dt>
            <dd className="mt-1 text-2xl tabular-nums">{item.valor}</dd>
          </div>
        ))}
      </dl>

      {briefings.length === 0 ? (
        <p className={`${card} mt-8 p-6 text-muted`}>Nenhum pedido recebido até agora.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {briefings.map((briefing) => (
            <li key={briefing.id} className={`${card} p-4 sm:p-5`}>
              <Link href={`/painel/${briefing.id}`} className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-56">
                  <p className="font-medium">
                    <span className="font-display text-lg tracking-wide">{briefing.reference}</span>
                    <span className="ml-3 text-muted">{briefing.name}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {briefing.environment_type} · {briefing.deadline} · {data(briefing.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {briefing.notify_status === "falhou" ? (
                    <span className="rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
                      Aviso não enviado
                    </span>
                  ) : null}
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${estilos[briefing.status]}`}>
                    {rotulos[briefing.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
