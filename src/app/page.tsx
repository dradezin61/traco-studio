import Link from "next/link";

import { ProjectCover } from "@/components/project-cover";
import { btnPrimary, btnSecondary, eyebrow } from "@/components/ui";
import { studio } from "@/lib/studio";
import { createClient } from "@/lib/supabase/server";

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  year: number;
  location: string;
  cover_path: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, slug, title, summary, category, year, location, cover_path")
    .eq("published", true)
    .order("sort_order")
    .order("year", { ascending: false })
    .limit(3)
    .returns<Project[]>();
  const destaques = data ?? [];

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <p className={eyebrow}>
          {studio.tagline} · {studio.city}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl">
          Espaços desenhados a partir de como se vive neles.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Projetos residenciais, comerciais e de interiores conduzidos do primeiro desenho à obra entregue.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/orcamento" className={btnPrimary}>
            Pedir orçamento
          </Link>
          <Link href="/projetos" className={btnSecondary}>
            Ver projetos
          </Link>
        </div>
      </section>

      {destaques.length > 0 ? (
        <section aria-labelledby="destaques" className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-8">
            <h2 id="destaques" className="font-display text-2xl sm:text-3xl">
              Projetos recentes
            </h2>
            <Link href="/projetos" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
              Ver todos
            </Link>
          </div>

          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((projeto, indice) => (
              <li key={projeto.id}>
                <Link href={`/projetos/${projeto.slug}`} className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  <ProjectCover
                    path={projeto.cover_path}
                    alt={null}
                    title={projeto.title}
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
                    priority={indice === 0}
                    className="rounded-lg transition-opacity group-hover:opacity-90"
                  />
                  <p className={`${eyebrow} mt-4`}>
                    {projeto.category} · {projeto.year}
                  </p>
                  <h3 className="mt-2 font-display text-xl">{projeto.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{projeto.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto mt-20 w-full max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 border-t border-border/70 pt-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <h2 className="font-display text-2xl sm:text-3xl">Como trabalhamos</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { titulo: "Conversa inicial", texto: "Entendemos o espaço, a rotina de quem usa e o que precisa mudar." },
              { titulo: "Projeto", texto: "Plantas, materiais e detalhamento, revisados junto com você." },
              { titulo: "Acompanhamento", texto: "Seguimos a obra até a entrega, ajustando o que o canteiro pedir." },
            ].map((etapa, indice) => (
              <div key={etapa.titulo}>
                <p className="font-display text-lg text-accent">{String(indice + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-medium">{etapa.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{etapa.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
