import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

/**
 * Usuário logado (ou null). O banco é dividido com a Orbe, então ter conta não
 * significa nada aqui: administrar o estúdio exige registro em traco.admins.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("full_name")
    .eq("id", claims.sub)
    .maybeSingle<{ full_name: string }>();

  const email = typeof claims.email === "string" ? claims.email : "";
  return {
    id: claims.sub,
    email,
    name: admin?.full_name ?? email.split("@")[0],
    isAdmin: Boolean(admin),
  };
});

export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) redirect("/entrar?erro=forbidden");
  return viewer;
}
