import { studio } from "@/lib/studio";

type Message = { to: string; subject: string; heading: string; lines: string[]; replyTo?: string };

/** Aceito pelo provedor não é o mesmo que entregue; o painel mostra essa diferença. */
export type SendOutcome = { ok: boolean; detail: string };

function sender() {
  const raw = process.env.EMAIL_FROM?.trim() || `${studio.name} ${studio.suffix} <onboarding@resend.dev>`;
  const parts = raw.match(/^(.*?)\s*<([^>]+)>$/);
  return { name: parts?.[1]?.trim() || `${studio.name} ${studio.suffix}`, email: (parts?.[2] ?? raw).trim() };
}

async function send({ to, subject, heading, lines, replyTo }: Message): Promise<SendOutcome> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`[email] sem BREVO_API_KEY; nada foi enviado ("${subject}")`);
    return { ok: false, detail: "sem_configuracao" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: sender(),
        to: [{ email: to }],
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject,
        htmlContent: render(heading, lines),
        textContent: [heading, "", ...lines].join("\n"),
      }),
    });

    if (!response.ok) {
      console.error(`[email] Brevo recusou "${subject}": HTTP ${response.status}`);
      return { ok: false, detail: `provedor_${response.status}` };
    }
    return { ok: true, detail: "aceito_pelo_provedor" };
  } catch (error) {
    // Só o tipo do erro: nada de conteúdo, destinatário ou credencial no registro.
    const nome = error instanceof Error ? error.name : "desconhecida";
    console.error(`[email] exceção ao enviar "${subject}": ${nome}`);
    return { ok: false, detail: `excecao_${nome}` };
  }
}

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function render(heading: string, lines: string[]) {
  const body = lines.map((line) => `<p style="margin:0 0 12px;line-height:1.55">${escape(line)}</p>`).join("");
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f2ee;font-family:Arial,sans-serif;color:#1a1c1a">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-size:18px;letter-spacing:0.04em">${escape(studio.name)} ${escape(studio.suffix)}</p>
<div style="background:#ffffff;border:1px solid #ded9d0;border-radius:10px;padding:24px">
<h1 style="margin:0 0 16px;font-size:19px">${escape(heading)}</h1>${body}</div>
</div></body></html>`;
}

type BriefingEmail = {
  reference: string;
  name: string;
  email: string;
  environmentType: string;
  areaM2: number | null;
  deadline: string;
  needs: string;
  attachments: number;
  link: string;
};

/** Aviso ao estúdio de que chegou um pedido. Responder vai direto para quem pediu. */
export function sendBriefingNotification(to: string, briefing: BriefingEmail) {
  return send({
    to,
    replyTo: briefing.email,
    subject: `Novo pedido de orçamento ${briefing.reference} — ${briefing.environmentType}`,
    heading: `Pedido ${briefing.reference}`,
    lines: [
      `${briefing.name} (${briefing.email}) pediu um orçamento.`,
      `Ambiente: ${briefing.environmentType}${briefing.areaM2 ? `, ${briefing.areaM2} m²` : ""}.`,
      `Prazo desejado: ${briefing.deadline}.`,
      `Referências anexadas: ${briefing.attachments}.`,
      "",
      briefing.needs,
      "",
      `Abrir no painel: ${briefing.link}`,
    ],
  });
}
