"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { sendBriefingNotification } from "@/lib/email";
import { errorCodeFrom } from "@/lib/messages";
import { deadlines, environmentTypes } from "@/lib/studio";
import { createAdminClient } from "@/lib/supabase/admin";

const DRAFT_COOKIE = "traco_rascunho";
const BUCKET = "traco-briefings";
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const TAMANHO_MAXIMO = 6 * 1024 * 1024;
const MAXIMO_ARQUIVOS = 6;

/**
 * Identifica o rascunho do visitante por um cookie próprio. Sem ele, os anexos
 * enviados antes do envio do formulário ficariam órfãos — e ninguém conseguiria
 * reivindicar os anexos de outra pessoa, porque o identificador não circula.
 */
async function draftId() {
  const store = await cookies();
  const atual = store.get(DRAFT_COOKIE)?.value;
  if (atual && /^[0-9a-f-]{36}$/.test(atual)) return atual;

  const novo = randomUUID();
  store.set(DRAFT_COOKIE, novo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return novo;
}

export type UploadTarget =
  | { ok: true; signedUrl: string; token: string; path: string }
  | { ok: false; erro: string };

/**
 * Prepara o envio de um anexo: valida tipo e tamanho e devolve uma URL assinada
 * de curta duração. O arquivo vai do navegador direto ao bucket privado, o que
 * permite mostrar progresso real; a chave secreta nunca sai do servidor.
 */
export async function prepareUpload(nome: string, tamanho: number, tipo: string): Promise<UploadTarget> {
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number]) || tamanho <= 0 || tamanho > TAMANHO_MAXIMO) {
    return { ok: false, erro: "arquivo_invalido" };
  }

  const rascunho = await draftId();
  const admin = createAdminClient();

  const { count } = await admin
    .from("briefing_files")
    .select("id", { count: "exact", head: true })
    .eq("draft_id", rascunho);
  if ((count ?? 0) >= MAXIMO_ARQUIVOS) return { ok: false, erro: "muitos_arquivos" };

  const extensao = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[tipo] ?? "jpg";
  const caminho = `rascunhos/${rascunho}/${randomUUID()}.${extensao}`;

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(caminho);
  if (error || !data) {
    console.error(`[briefing] não consegui preparar o envio: ${error?.message ?? "sem dados"}`);
    return { ok: false, erro: "erro_inesperado" };
  }
  // O nome do arquivo é registrado só depois que o envio termina.
  return { ok: true, signedUrl: data.signedUrl, token: data.token, path: caminho };
}

/** Registra o anexo já enviado. Chamado pelo navegador ao fim do upload. */
export async function registerUpload(caminho: string, nome: string, tamanho: number, tipo: string) {
  const rascunho = await draftId();
  if (!caminho.startsWith(`rascunhos/${rascunho}/`)) return { ok: false as const, erro: "forbidden" };

  const { error } = await createAdminClient().rpc("register_draft_file", {
    p_draft: rascunho,
    p_path: caminho,
    p_name: nome,
    p_size: Math.round(tamanho),
    p_mime: tipo,
  });
  if (error) return { ok: false as const, erro: errorCodeFrom(error) };
  return { ok: true as const };
}

/** Remove um anexo do rascunho, do banco e do Storage. */
export async function removeUpload(caminho: string) {
  const rascunho = await draftId();
  if (!caminho.startsWith(`rascunhos/${rascunho}/`)) return { ok: false as const, erro: "forbidden" };

  const admin = createAdminClient();
  await admin.from("briefing_files").delete().eq("storage_path", caminho).eq("draft_id", rascunho);
  await admin.storage.from(BUCKET).remove([caminho]);
  return { ok: true as const };
}

const briefingSchema = z.object({
  environmentType: z.enum(environmentTypes),
  areaM2: z.union([z.coerce.number().int().positive().max(99999), z.literal("")]).optional(),
  needs: z.string().trim().min(10).max(4000),
  deadline: z.enum(deadlines),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

function siteOrigin(host: string | null) {
  const producao = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (producao) return `https://${producao}`;
  return `http://${host ?? "localhost:3000"}`;
}

/**
 * Grava o pedido e avisa o estúdio. O aviso sai depois da resposta (`after`) e
 * seu resultado fica registrado: se o e-mail falhar, o briefing continua de pé
 * e o painel mostra um botão para tentar de novo, sem duplicar nada.
 */
export async function submitBriefing(formData: FormData) {
  const parsed = briefingSchema.safeParse({
    environmentType: formData.get("environmentType"),
    areaM2: formData.get("areaM2") ?? "",
    needs: formData.get("needs"),
    deadline: formData.get("deadline"),
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) redirect("/orcamento?erro=dados_invalidos");

  const rascunho = (await cookies()).get(DRAFT_COOKIE)?.value ?? null;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("submit_briefing", {
    p_environment_type: parsed.data.environmentType,
    p_area_m2: typeof parsed.data.areaM2 === "number" ? parsed.data.areaM2 : null,
    p_needs: parsed.data.needs,
    p_deadline: parsed.data.deadline,
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_draft: rascunho,
  });

  // A função devolve uma linha (id, reference); sem tipos gerados, o cast é aqui.
  const briefing = (data as unknown as { id: string; reference: string }[] | null)?.[0];
  if (error || !briefing) redirect(`/orcamento?erro=${errorCodeFrom(error)}`);

  // O rascunho acabou: o cookie some para o próximo pedido começar limpo.
  (await cookies()).delete(DRAFT_COOKIE);

  const origem = siteOrigin((await headers()).get("host"));
  const destino = process.env.CONTACT_INBOX?.trim();
  const { count } = await admin
    .from("briefing_files")
    .select("id", { count: "exact", head: true })
    .eq("briefing_id", briefing.id);

  after(async () => {
    if (!destino) {
      await admin.rpc("set_briefing_notification", { p_briefing: briefing.id, p_status: "falhou", p_detail: "sem_destinatario" });
      return;
    }
    const resultado = await sendBriefingNotification(destino, {
      reference: briefing.reference,
      name: parsed.data.name,
      email: parsed.data.email,
      environmentType: parsed.data.environmentType,
      areaM2: typeof parsed.data.areaM2 === "number" ? parsed.data.areaM2 : null,
      deadline: parsed.data.deadline,
      needs: parsed.data.needs,
      attachments: count ?? 0,
      link: `${origem}/painel/${briefing.id}`,
    });
    await admin.rpc("set_briefing_notification", {
      p_briefing: briefing.id,
      p_status: resultado.ok ? "enviado" : "falhou",
      p_detail: resultado.detail,
    });
  });

  redirect(`/orcamento/enviado?ref=${briefing.reference}`);
}
