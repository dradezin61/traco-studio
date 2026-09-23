-- Pedidos de orçamento (briefings) e seus anexos.
--
-- O que o visitante manda é privado: nome, e-mail, descrição do ambiente e
-- imagens de referência. Nada disso é legível sem ser administração, e os
-- arquivos ficam em bucket privado, acessíveis só por URL assinada de curta
-- duração gerada no servidor.
--
-- A tabela messages da primeira versão sai: o formulário de contato virou este
-- fluxo, e ela nunca recebeu registros.
drop table if exists traco.messages;
drop function if exists traco.submit_message(text, text, text);

create table traco.briefings (
  id uuid primary key default gen_random_uuid(),
  -- Código curto mostrado a quem enviou, para citar em uma resposta.
  reference text not null unique,
  environment_type text not null,
  area_m2 int check (area_m2 is null or (area_m2 > 0 and area_m2 < 100000)),
  needs text not null check (char_length(needs) between 10 and 4000),
  deadline text not null,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  -- recebido -> em_analise -> respondido
  status text not null default 'recebido' check (status in ('recebido', 'em_analise', 'respondido')),
  -- Aviso por e-mail ao estúdio: o briefing existe mesmo que o envio falhe.
  notify_status text not null default 'pendente' check (notify_status in ('pendente', 'enviado', 'falhou')),
  notify_detail text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index briefings_status_idx on traco.briefings (status, created_at desc);

/**
 * Arquivos enviados como referência. Começam presos a um rascunho (o visitante
 * ainda não terminou o formulário) e passam a pertencer ao briefing no envio.
 */
create table traco.briefing_files (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid references traco.briefings (id) on delete cascade,
  draft_id uuid,
  storage_path text not null unique,
  original_name text not null,
  size_bytes int not null check (size_bytes > 0),
  mime text not null,
  created_at timestamptz not null default now(),
  check (briefing_id is not null or draft_id is not null)
);

create index briefing_files_briefing_idx on traco.briefing_files (briefing_id);
create index briefing_files_draft_idx on traco.briefing_files (draft_id);

alter table traco.briefings enable row level security;
alter table traco.briefing_files enable row level security;

create policy "briefings só para a administração"
  on traco.briefings for select to authenticated
  using (traco.is_admin());

create policy "anexos só para a administração"
  on traco.briefing_files for select to authenticated
  using (traco.is_admin());

/** Código curto e legível, do tipo TR-7K2Q. */
create function traco.new_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'TR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
$$;

/**
 * Grava o briefing e adota os arquivos do rascunho. Chamada pelo servidor, que
 * já validou os campos; as travas aqui são a última linha de defesa.
 */
create function traco.submit_briefing(
  p_environment_type text, p_area_m2 int, p_needs text, p_deadline text,
  p_name text, p_email text, p_draft uuid
)
returns table (id uuid, reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_ref text;
  v_email text := lower(trim(p_email));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'email_invalido'; end if;
  if char_length(trim(p_name)) < 2 then raise exception 'nome_invalido'; end if;
  if char_length(trim(p_needs)) < 10 then raise exception 'mensagem_curta'; end if;

  -- Freio contra reenvio acidental do mesmo formulário.
  if exists (
    select 1 from traco.briefings
     where email = v_email and created_at > now() - interval '2 minutes'
  ) then
    raise exception 'muitas_mensagens';
  end if;

  v_ref := traco.new_reference();
  insert into traco.briefings (reference, environment_type, area_m2, needs, deadline, name, email)
  values (v_ref, p_environment_type, p_area_m2, trim(p_needs), p_deadline, trim(p_name), v_email)
  returning traco.briefings.id into v_id;

  if p_draft is not null then
    update traco.briefing_files
       set briefing_id = v_id, draft_id = null
     where draft_id = p_draft;
  end if;

  return query select v_id, v_ref;
end;
$$;

/** Registra um arquivo já enviado ao bucket privado, ainda como rascunho. */
create function traco.register_draft_file(
  p_draft uuid, p_path text, p_name text, p_size int, p_mime text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'image/avif') then raise exception 'arquivo_invalido'; end if;
  if p_size <= 0 or p_size > 6 * 1024 * 1024 then raise exception 'arquivo_invalido'; end if;
  if (select count(*) from traco.briefing_files where draft_id = p_draft) >= 6 then raise exception 'muitos_arquivos'; end if;

  insert into traco.briefing_files (draft_id, storage_path, original_name, size_bytes, mime)
  values (p_draft, p_path, left(p_name, 200), p_size, p_mime)
  returning traco.briefing_files.id into v_id;
  return v_id;
end;
$$;

/** Andamento do pedido, pela administração. */
create function traco.set_briefing_status(p_briefing uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('recebido', 'em_analise', 'respondido') then raise exception 'dados_invalidos'; end if;
  update traco.briefings set status = p_status, updated_at = now() where id = p_briefing;
  if not found then raise exception 'briefing_nao_encontrado'; end if;
end;
$$;

/** Resultado do aviso por e-mail; nunca desfaz o briefing. */
create function traco.set_briefing_notification(p_briefing uuid, p_status text, p_detail text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('pendente', 'enviado', 'falhou') then raise exception 'dados_invalidos'; end if;
  update traco.briefings
     set notify_status = p_status,
         notify_detail = left(coalesce(p_detail, ''), 300),
         notified_at = case when p_status = 'enviado' then now() else notified_at end,
         updated_at = now()
   where id = p_briefing;
end;
$$;

revoke all on function traco.submit_briefing(text, int, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function traco.register_draft_file(uuid, text, text, int, text) from public, anon, authenticated;
revoke all on function traco.set_briefing_notification(uuid, text, text) from public, anon, authenticated;
revoke all on function traco.set_briefing_status(uuid, text) from public, anon;
revoke all on function traco.new_reference() from public, anon, authenticated;

-- Envio e registro de anexo passam pelo servidor (chave secreta), nunca pelo
-- navegador: assim ninguém cria briefings em massa direto na API.
grant execute on function traco.submit_briefing(text, int, text, text, text, text, uuid) to service_role;
grant execute on function traco.register_draft_file(uuid, text, text, int, text) to service_role;
grant execute on function traco.set_briefing_notification(uuid, text, text) to service_role;
grant execute on function traco.set_briefing_status(uuid, text) to authenticated;
grant select on traco.briefings, traco.briefing_files to authenticated;
