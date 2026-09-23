// Dados fixos do estúdio usados nas telas.

export const studio = {
  name: "Traço",
  suffix: "Studio",
  tagline: "Arquitetura e interiores",
  city: "São Paulo",
  founded: 2016,
} as const;

export const categories = ["Residencial", "Comercial", "Interiores"] as const;
export type Category = (typeof categories)[number];

/** Etapas do briefing, na ordem em que aparecem no formulário. */
export const briefingSteps = ["Ambiente", "Necessidades", "Prazo", "Contato"] as const;

export const environmentTypes = [
  "Apartamento",
  "Casa",
  "Escritório",
  "Loja",
  "Restaurante",
  "Outro",
] as const;

export const deadlines = [
  "Assim que possível",
  "Nos próximos 3 meses",
  "Entre 3 e 6 meses",
  "Ainda estou planejando",
] as const;

export const author = {
  name: "Gabriel Andrade",
  portfolio: "https://gabriel-andrade-omega.vercel.app/",
  repository: "https://github.com/dradezin61/traco-studio",
} as const;

/** Bucket público do catálogo; os anexos dos briefings ficam em bucket privado. */
export const PUBLIC_BUCKET = "traco-projetos";
