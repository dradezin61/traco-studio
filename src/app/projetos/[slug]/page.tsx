import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectGallery, type GalleryImage } from "@/components/project-gallery";
import { btnPrimary, eyebrow } from "@/components/ui";
import { publicImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  year: number;
  location: string;
  area_m2: number | null;
  sort_order: number;
  project_images: { id: string; storage_path: string; alt: string; sort_order: number }[];
};

async function buscar(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, slug, title, summary, description, category, year, location, area_m2, sort_order, project_images(id, storage_path, alt, sort_order)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<Project>();
  return data;
}

/** Projeto anterior e próximo, na mesma ordem da galeria. */
async function vizinhos(atual: Project) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("slug, title, sort_order, year")
    .eq("published", true)
    .order("sort_order")
    .order("year", { ascending: false })
    .returns<{ slug: string; title: string }[]>();

  const lista = data ?? [];
  const indice = lista.findIndex((p) => p.slug === atual.slug);
  if (indice < 0) return { anterior: null, proximo: null };
  return {
    anterior: indice > 0 ? lista[indice - 1] : lista[lista.length - 1] ?? null,
    proximo: indice < lista.length - 1 ? lista[indice + 1] : lista[0] ?? null,
  };
}

export async function generateMetadata({ params }: PageProps<"/projetos/[slug]">): Promise<Metadata> {
  const projeto = await buscar((await params).slug);
  return projeto ? { title: projeto.title, description: projeto.summary } : { title: "Projeto" };
}

export default async function ProjectPage({ params }: PageProps<"/projetos/[slug]">) {
  const { slug } = await params;
  const projeto = await buscar(slug);
  if (!projeto) notFound();

  const { anterior, proximo } = await vizinhos(projeto);
  const imagens: GalleryImage[] = [...projeto.project_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((imagem) => {
      const url = publicImageUrl(imagem.storage_path);
      return url ? [{ url, alt: imagem.alt }] : [];
    });

  const ficha = [
    { termo: "Categoria", valor: projeto.category },
    { termo: "Ano", valor: String(projeto.year) },
    { termo: "Local", valor: projeto.location },
    ...(projeto.area_m2 ? [{ termo: "Área", valor: `${projeto.area_m2} m²` }] : []),
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8">
      <Link href="/projetos" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
        Voltar aos projetos
      </Link>

      <header className="mt-6 border-b border-border/70 pb-8">
        <p className={eyebrow}>{projeto.category}</p>
        <h1 className="mt-3 font-display text-[2.5rem] font-medium leading-[1.1] tracking-[-0.01em] sm:text-6xl">{projeto.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{projeto.summary}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px] lg:gap-14">
        <div className="order-2 lg:order-1">
          <ProjectGallery images={imagens} />
        </div>

        <aside className="order-1 lg:order-2">
          <dl className="grid gap-4 text-sm">
            {ficha.map((item) => (
              <div key={item.termo} className="border-b border-border/70 pb-3">
                <dt className={eyebrow}>{item.termo}</dt>
                <dd className="mt-1.5 text-base">{item.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 whitespace-pre-line leading-relaxed">{projeto.description}</p>
          <Link href="/orcamento" className={`${btnPrimary} mt-7 w-full`}>
            Quero um projeto assim
          </Link>
        </aside>
      </div>

      <nav aria-label="Outros projetos" className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-8">
        {anterior ? (
          <Link href={`/projetos/${anterior.slug}`} className="group max-w-[45%]">
            <span className={eyebrow}>Anterior</span>
            <span className="mt-1 block font-display text-lg font-semibold transition-colors group-hover:text-accent">{anterior.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {proximo ? (
          <Link href={`/projetos/${proximo.slug}`} className="group max-w-[45%] text-right">
            <span className={eyebrow}>Próximo</span>
            <span className="mt-1 block font-display text-lg font-semibold transition-colors group-hover:text-accent">{proximo.title}</span>
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
