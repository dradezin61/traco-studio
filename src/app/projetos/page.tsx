import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCover } from "@/components/project-cover";
import { Reveal } from "@/components/reveal";
import { eyebrow } from "@/components/ui";
import { categories } from "@/lib/studio";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projetos" };

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

export default async function ProjectsPage({ searchParams }: PageProps<"/projetos">) {
  const query = await searchParams;
  const bruta = typeof query.categoria === "string" ? query.categoria : undefined;
  const categoria = categories.find((c) => c === bruta);

  const supabase = await createClient();
  let consulta = supabase
    .from("projects")
    .select("id, slug, title, summary, category, year, location, cover_path")
    .eq("published", true)
    .order("sort_order")
    .order("year", { ascending: false });
  if (categoria) consulta = consulta.eq("category", categoria);

  const { data } = await consulta.returns<Project[]>();
  const projetos = data ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
      <h1 className="font-display text-[2.5rem] font-medium leading-[1.1] tracking-[-0.01em] sm:text-6xl">Projetos</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">
        Residências, espaços comerciais e reformas de interiores.
      </p>

      <nav aria-label="Categorias" className="mt-8 flex flex-wrap gap-2">
        {[{ label: "Todos", value: undefined as string | undefined }, ...categories.map((c) => ({ label: c, value: c as string | undefined }))].map(
          (item) => {
            const ativo = categoria === item.value;
            return (
              <Link
                key={item.label}
                href={item.value ? `/projetos?categoria=${encodeURIComponent(item.value)}` : "/projetos"}
                aria-current={ativo ? "page" : undefined}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  ativo ? "border-brand bg-brand text-white" : "border-border text-muted hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          },
        )}
      </nav>

      {projetos.length === 0 ? (
        <p className="mt-10 rounded-lg border border-border bg-surface p-6 text-muted">
          Nenhum projeto publicado nesta categoria por enquanto.
        </p>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((projeto, indice) => (
            <li key={`${categoria ?? "todos"}-${projeto.id}`}>
              <Reveal atraso={indice * 70}>
              <Link
                href={`/projetos/${projeto.slug}`}
                className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <ProjectCover
                  path={projeto.cover_path}
                  alt={null}
                  title={projeto.title}
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
                  priority={indice < 3}
                  className="rounded-[10px]"
                />
                <p className={`${eyebrow} mt-4`}>
                  {projeto.category} · {projeto.year} · {projeto.location}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold transition-colors group-hover:text-accent">{projeto.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{projeto.summary}</p>
              </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
