-- Guarda o estado das galerias antes de cada troca de fotografias, para que a
-- revisão possa ser desfeita sem adivinhação. Os arquivos antigos continuam no
-- Storage: nada é apagado por aqui.
create table traco.gallery_backup (
  revision text not null,
  project_slug text not null,
  cover_path text,
  images jsonb not null,
  saved_at timestamptz not null default now(),
  primary key (revision, project_slug)
);

-- Uso interno: só a manutenção pelo banco escreve e lê. Sem política, nem o
-- site nem o painel enxergam a tabela.
alter table traco.gallery_backup enable row level security;
