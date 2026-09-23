-- O Traço Studio divide o banco do Supabase com a Orbe (o plano gratuito
-- permite dois projetos por conta), mas vive em um schema próprio: nada aqui
-- enxerga as tabelas da loja, e vice-versa. As contas de acesso (auth.users)
-- são compartilhadas, então administrar o estúdio exige um registro em
-- traco.admins — ter conta na loja não dá acesso a nada daqui.

create schema if not exists traco;

create table traco.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create function traco.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from traco.admins where id = auth.uid());
$$;

create table traco.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null check (char_length(summary) between 1 and 240),
  description text not null,
  category text not null check (category in ('Residencial', 'Comercial', 'Interiores')),
  year int not null check (year between 1900 and 2100),
  location text not null,
  area_m2 int check (area_m2 is null or area_m2 > 0),
  -- Caminho do arquivo no Storage; a capa também aparece em project_images.
  cover_path text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_published_idx on traco.projects (published, sort_order, year desc);

create table traco.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references traco.projects (id) on delete cascade,
  storage_path text not null,
  alt text not null check (char_length(alt) between 1 and 300),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index project_images_project_idx on traco.project_images (project_id, sort_order);

-- Mensagens do formulário de contato. Contêm nome e e-mail de terceiros: só a
-- administração lê, e a escrita passa por função, nunca por política aberta.
create table traco.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  body text not null check (char_length(body) between 10 and 4000),
  status text not null default 'nova' check (status in ('nova', 'respondida')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

create index messages_status_idx on traco.messages (status, created_at desc);

alter table traco.admins enable row level security;
alter table traco.projects enable row level security;
alter table traco.project_images enable row level security;
alter table traco.messages enable row level security;

create policy "administração lê a si mesma"
  on traco.admins for select to authenticated
  using (id = auth.uid());

create policy "projetos publicados são públicos"
  on traco.projects for select to anon, authenticated
  using (published or traco.is_admin());

create policy "imagens seguem o projeto"
  on traco.project_images for select to anon, authenticated
  using (
    exists (
      select 1 from traco.projects p
      where p.id = project_id and (p.published or traco.is_admin())
    )
  );

create policy "mensagens só para a administração"
  on traco.messages for select to authenticated
  using (traco.is_admin());

-- O Data API precisa enxergar o schema; as tabelas ficam acessíveis conforme as
-- políticas acima.
grant usage on schema traco to anon, authenticated, service_role;
grant select on traco.projects, traco.project_images to anon, authenticated;
grant select on traco.admins, traco.messages to authenticated;
grant all on all tables in schema traco to service_role;
