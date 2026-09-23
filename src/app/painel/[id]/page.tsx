import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { resendBriefingNotification, setBriefingStatus } from "@/app/admin-actions";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, card, eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pedido" };

type Briefing = {
  id: string;
  reference: string;
  name: string;
  email: string;
  environment_type: string;
  area_m2: number | null;
  deadline: string;
  needs: string;
  status: "recebido" | "em_analise" | "respondido";
  notify_status: "pendente" | "enviado" | "falhou";
  notify_detail: string | null;
  notified_at: string | null;
  created_at: string;
  briefing_files: { id: string; storage_path: string; original_name: string; size_bytes: number }[];
};

const rotulos = { recebido: "Recebido", em_analise: "Em análise", respondido: "Respondido" } as const;

const dataHora = (valor: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(valor));

export default async function BriefingDetailPage({ params, searchParams }: PageProps<"/painel/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;

  // Leitura pela sessão do usuário: quem não é administração não enxerga nada,
  // por decisão do banco, e não por uma verificação na tela.
  const supabase = await createClient();
  const { data: briefing } = await supabase
    .from("briefings")
    .select(
      "id, reference, name, email, environment_type, area_m2, deadline, needs, status, notify_status, notify_detail, notified_at, created_at, briefing_files(id, storage_path, original_name, size_bytes)",
    )
    .eq("id", id)
    .maybeSingle<Briefing>();
  if (!briefing) notFound();

  // URLs assinadas de 5 minutos: o bucket é privado e nenhum caminho vira link fixo.
  const admin = createAdminClient();
  const anexos = await Promise.all(
    briefing.briefing_files.map(async (arquivo) => {
      const { data } = await admin.storage.from("traco-briefings").createSignedUrl(arquivo.storage_path, 300);
      return { ...arquivo, url: data?.signedUrl ?? null };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8">
      <Link href="/painel" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
        Voltar ao painel
      </Link>

      <header className="mt-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wide">{briefing.reference}</h1>
          <p className="mt-2 text-muted">Recebido em {dataHora(briefing.created_at)}</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-sm">{rotulos[briefing.status]}</span>
      </header>

      <div className="mt-5">
        <Flash
          ok={typeof query.ok === "string" ? query.ok : undefined}
          erro={typeof query.erro === "string" ? query.erro : undefined}
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <div>
          <h2 className={eyebrow}>Necessidades</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed">{briefing.needs}</p>

          <h2 className={`${eyebrow} mt-10`}>Referências ({anexos.length})</h2>
          {anexos.length === 0 ? (
            <p className="mt-3 text-muted">Nenhuma imagem anexada.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {anexos.map((anexo) => (
                <li key={anexo.id} className={`${card} overflow-hidden`}>
                  {anexo.url ? (
                    <a href={anexo.url} target="_blank" rel="noreferrer" className="block">
                      <div className="relative aspect-4/3 bg-surface-muted">
                        <Image src={anexo.url} alt={anexo.original_name} fill sizes="(min-width: 640px) 320px, 92vw" className="object-cover" unoptimized />
                      </div>
                    </a>
                  ) : (
                    <div className="grid aspect-4/3 place-items-center bg-surface-muted text-sm text-muted">
                      Não consegui gerar o link
                    </div>
                  )}
                  <p className="truncate px-3 py-2 text-xs text-muted">
                    {anexo.original_name} · {Math.round(anexo.size_bytes / 1024)} KB
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-8">
          <dl className="grid gap-3 text-sm">
            {[
              { termo: "Contato", valor: briefing.name },
              { termo: "E-mail", valor: briefing.email },
              { termo: "Ambiente", valor: `${briefing.environment_type}${briefing.area_m2 ? `, ${briefing.area_m2} m²` : ""}` },
              { termo: "Prazo", valor: briefing.deadline },
            ].map((item) => (
              <div key={item.termo} className="border-b border-border/70 pb-3">
                <dt className={eyebrow}>{item.termo}</dt>
                <dd className="mt-1.5 break-words text-base">{item.valor}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className={eyebrow}>Andamento</h2>
            <div className="mt-3 grid gap-2">
              {(["recebido", "em_analise", "respondido"] as const).map((valor) => (
                <form key={valor} action={setBriefingStatus}>
                  <input type="hidden" name="briefingId" value={briefing.id} />
                  <input type="hidden" name="status" value={valor} />
                  <SubmitButton
                    className={`${briefing.status === valor ? btnPrimary : btnSecondary} w-full`}
                    pendingLabel="Salvando…"
                    disabled={briefing.status === valor}
                  >
                    {rotulos[valor]}
                  </SubmitButton>
                </form>
              ))}
            </div>
          </div>

          <div>
            <h2 className={eyebrow}>Aviso por e-mail</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {briefing.notify_status === "enviado"
                ? `Aceito pelo provedor${briefing.notified_at ? ` em ${dataHora(briefing.notified_at)}` : ""}.`
                : briefing.notify_status === "falhou"
                  ? `Não saiu (${briefing.notify_detail ?? "motivo não registrado"}). O pedido está salvo.`
                  : "Ainda não processado."}
            </p>
            {briefing.notify_status !== "enviado" ? (
              <form action={resendBriefingNotification} className="mt-3">
                <input type="hidden" name="briefingId" value={briefing.id} />
                <SubmitButton className={`${btnSecondary} w-full`} pendingLabel="Enviando…">
                  Tentar enviar de novo
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
