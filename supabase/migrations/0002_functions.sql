-- Regras do estúdio no banco: escrita só por função, nunca por política aberta.

/** "Casa São João" -> "casa-sao-joao". Sem depender de extensão instalada. */
create function traco.slugify(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(p_text,
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')),
    '[^a-z0-9]+', '-', 'g'));
$$;

/** Mensagem do formulário público. Valida e guarda; o e-mail sai pelo app. */
create function traco.submit_message(p_name text, p_email text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := trim(p_name);
  v_email text := lower(trim(p_email));
  v_body text := trim(p_body);
begin
  if char_length(v_name) < 2 then raise exception 'nome_invalido'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'email_invalido'; end if;
  if char_length(v_body) < 10 then raise exception 'mensagem_curta'; end if;

  -- Freio simples contra envio repetido do mesmo endereço.
  if exists (
    select 1 from traco.messages
     where email = v_email and created_at > now() - interval '2 minutes'
  ) then
    raise exception 'muitas_mensagens';
  end if;

  insert into traco.messages (name, email, body)
  values (left(v_name, 120), left(v_email, 200), left(v_body, 4000))
  returning id into v_id;
  return v_id;
end;
$$;

/** Cria ou atualiza um projeto. O slug nasce do título e não muda depois. */
create function traco.save_project(
  p_id uuid, p_title text, p_summary text, p_description text,
  p_category text, p_year int, p_location text, p_area_m2 int, p_published boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_slug text;
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;

  if p_id is null then
    v_slug := traco.slugify(p_title);
    if v_slug = '' then raise exception 'titulo_invalido'; end if;
    if exists (select 1 from traco.projects where slug = v_slug) then
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    end if;
    insert into traco.projects (slug, title, summary, description, category, year, location, area_m2, published)
    values (v_slug, p_title, p_summary, p_description, p_category, p_year, p_location, p_area_m2, p_published)
    returning id into v_id;
  else
    update traco.projects
       set title = p_title, summary = p_summary, description = p_description, category = p_category,
           year = p_year, location = p_location, area_m2 = p_area_m2, published = p_published,
           updated_at = now()
     where id = p_id
     returning id into v_id;
    if v_id is null then raise exception 'projeto_nao_encontrado'; end if;
  end if;

  return v_id;
end;
$$;

/** Registra uma foto já enviada ao Storage. A primeira vira capa sozinha. */
create function traco.add_project_image(p_project uuid, p_path text, p_alt text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_ordem int;
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;
  if not exists (select 1 from traco.projects where id = p_project) then raise exception 'projeto_nao_encontrado'; end if;

  select coalesce(max(sort_order), 0) + 1 into v_ordem from traco.project_images where project_id = p_project;

  insert into traco.project_images (project_id, storage_path, alt, sort_order)
  values (p_project, p_path, p_alt, v_ordem)
  returning id into v_id;

  update traco.projects set cover_path = coalesce(cover_path, p_path), updated_at = now() where id = p_project;
  return v_id;
end;
$$;

/** Remove a foto do registro e devolve o caminho, para o app apagar do Storage. */
create function traco.remove_project_image(p_image uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_img traco.project_images;
  v_nova_capa text;
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;
  delete from traco.project_images where id = p_image returning * into v_img;
  if v_img.id is null then raise exception 'imagem_nao_encontrada'; end if;

  -- Se a capa saiu, a próxima foto assume.
  select storage_path into v_nova_capa
    from traco.project_images where project_id = v_img.project_id order by sort_order limit 1;
  update traco.projects
     set cover_path = case when cover_path = v_img.storage_path then v_nova_capa else cover_path end,
         updated_at = now()
   where id = v_img.project_id;

  return v_img.storage_path;
end;
$$;

create function traco.set_cover(p_image uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_img traco.project_images;
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;
  select * into v_img from traco.project_images where id = p_image;
  if v_img.id is null then raise exception 'imagem_nao_encontrada'; end if;
  update traco.projects set cover_path = v_img.storage_path, updated_at = now() where id = v_img.project_id;
end;
$$;

/** Apaga o projeto e devolve os caminhos das fotos, para o app limpar o Storage. */
create function traco.delete_project(p_project uuid)
returns setof text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;
  return query
    with apagadas as (
      delete from traco.project_images where project_id = p_project returning storage_path
    ), projeto as (
      delete from traco.projects where id = p_project returning 1
    )
    select storage_path from apagadas;
end;
$$;

create function traco.mark_message_handled(p_message uuid, p_respondida boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not traco.is_admin() then raise exception 'forbidden'; end if;
  update traco.messages
     set status = case when p_respondida then 'respondida' else 'nova' end,
         handled_at = case when p_respondida then now() else null end
   where id = p_message;
  if not found then raise exception 'mensagem_nao_encontrada'; end if;
end;
$$;

revoke all on function traco.submit_message(text, text, text) from public;
revoke all on function traco.save_project(uuid, text, text, text, text, int, text, int, boolean) from public, anon;
revoke all on function traco.add_project_image(uuid, text, text) from public, anon;
revoke all on function traco.remove_project_image(uuid) from public, anon;
revoke all on function traco.set_cover(uuid) from public, anon;
revoke all on function traco.delete_project(uuid) from public, anon;
revoke all on function traco.mark_message_handled(uuid, boolean) from public, anon;

grant execute on function traco.submit_message(text, text, text) to anon, authenticated;
grant execute on function traco.save_project(uuid, text, text, text, text, int, text, int, boolean) to authenticated;
grant execute on function traco.add_project_image(uuid, text, text) to authenticated;
grant execute on function traco.remove_project_image(uuid) to authenticated;
grant execute on function traco.set_cover(uuid) to authenticated;
grant execute on function traco.delete_project(uuid) to authenticated;
grant execute on function traco.mark_message_handled(uuid, boolean) to authenticated;
