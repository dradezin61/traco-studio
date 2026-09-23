"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendBriefingNotification } from "@/lib/email";
import { errorCodeFrom } from "@/lib/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();
const status = z.enum(["recebido", "em_analise", "respondido"]);

export async function setBriefingStatus(formData: FormData) {
  await requireAdmin();
  const pedido = uuid.safeParse(formData.get("briefingId"));
  const novo = status.safeParse(formData.get("status"));
  if (!pedido.success || !novo.success) redirect("/painel?erro=dados_invalidos");

  // Pela sessão do usuário: a própria regra do banco confere se é administração.
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_briefing_status", { p_briefing: pedido.data, p_status: novo.data });
  if (error) redirect(`/painel?erro=${errorCodeFrom(error)}`);

  revalidatePath("/painel");
  redirect(`/painel/${pedido.data}?ok=briefing_atualizado`);
}

/**
 * Reenvia o aviso de um pedido cujo e-mail falhou. Não cria nada novo: o mesmo
 * briefing é notificado outra vez e o resultado volta a ser registrado.
 */
export async function resendBriefingNotification(formData: FormData) {
  await requireAdmin();
  const pedido = uuid.safeParse(formData.get("briefingId"));
  if (!pedido.success) redirect("/painel?erro=dados_invalidos");

  const supabase = await createClient();
  const { data: briefing } = await supabase
    .from("briefings")
    .select("id, reference, name, email, environment_type, area_m2, deadline, needs")
    .eq("id", pedido.data)
    .maybeSingle<{
      id: string;
      reference: string;
      name: string;
      email: string;
      environment_type: string;
      area_m2: number | null;
      deadline: string;
      needs: string;
    }>();
  if (!briefing) redirect("/painel?erro=briefing_nao_encontrado");

  const admin = createAdminClient();
  const { count } = await admin
    .from("briefing_files")
    .select("id", { count: "exact", head: true })
    .eq("briefing_id", briefing.id);

  const destino = process.env.CONTACT_INBOX?.trim();
  const host = (await headers()).get("host");
  const origem = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `http://${host ?? "localhost:3000"}`;

  const resultado = destino
    ? await sendBriefingNotification(destino, {
        reference: briefing.reference,
        name: briefing.name,
        email: briefing.email,
        environmentType: briefing.environment_type,
        areaM2: briefing.area_m2,
        deadline: briefing.deadline,
        needs: briefing.needs,
        attachments: count ?? 0,
        link: `${origem}/painel/${briefing.id}`,
      })
    : { ok: false, detail: "sem_destinatario" };

  await admin.rpc("set_briefing_notification", {
    p_briefing: briefing.id,
    p_status: resultado.ok ? "enviado" : "falhou",
    p_detail: resultado.detail,
  });

  revalidatePath(`/painel/${briefing.id}`);
  redirect(`/painel/${briefing.id}?${resultado.ok ? "ok=aviso_reenviado" : "erro=erro_inesperado"}`);
}
