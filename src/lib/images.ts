import { PUBLIC_BUCKET } from "@/lib/studio";

/**
 * Endereço público de uma foto do catálogo. O bucket é de leitura pública, então
 * o caminho basta — nada de URL assinada aqui. Anexos de briefing seguem outro
 * caminho, em bucket privado.
 */
export function publicImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${PUBLIC_BUCKET}/${path.replace(/^\/+/, "")}`;
}
