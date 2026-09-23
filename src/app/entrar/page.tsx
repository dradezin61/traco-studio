import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signIn } from "@/app/auth-actions";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { card, input, label } from "@/components/ui";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const viewer = await getViewer();
  if (viewer?.isAdmin) redirect("/painel");
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-16">
      <div className={`${card} p-6 sm:p-8`}>
        <h1 className="font-display text-2xl">Acesso do estúdio</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Área reservada à equipe. Os pedidos de orçamento trazem dados de quem escreveu, então não há acesso público.
        </p>
        <div className="mt-4">
          <Flash erro={typeof erro === "string" ? erro : undefined} />
        </div>

        <form action={signIn} className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="email" className={label}>E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={input} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="password" className={label}>Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className={input} />
          </div>
          <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
        </form>
      </div>
    </main>
  );
}
