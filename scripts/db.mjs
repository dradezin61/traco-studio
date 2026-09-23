// Prepara o banco do Supabase a partir do .env.local.
//   node scripts/db.mjs migrate        -> aplica supabase/migrations na ordem, uma vez cada
//   node scripts/db.mjs admin <e-mail> -> dá acesso de administração do estúdio a uma conta
//   node scripts/db.mjs bucket         -> cria (ou confere) o bucket de imagens no Storage
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const required = ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Faltam valores no .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const BUCKET = "traco-projetos";

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * As migrações do estúdio têm controle próprio (app_private.traco_migrations),
 * porque o banco é dividido com a Orbe e cada aplicação anda no seu passo.
 */
async function migrate() {
  await db.query("create schema if not exists app_private");
  await db.query(
    "create table if not exists app_private.traco_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set((await db.query("select name from app_private.traco_migrations")).rows.map((r) => r.name));
  const dir = join("supabase", "migrations");

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (applied.has(file)) {
      console.log(`  já aplicada  ${file}`);
      continue;
    }
    await db.query("begin");
    try {
      await db.query(readFileSync(join(dir, file), "utf8"));
      await db.query("insert into app_private.traco_migrations (name) values ($1)", [file]);
      await db.query("commit");
      console.log(`  aplicada     ${file}`);
    } catch (error) {
      await db.query("rollback");
      throw new Error(`Falhou em ${file}: ${error.message}`);
    }
  }
}

/**
 * Dá acesso ao painel a uma conta já existente. Fica fora das migrações para o
 * e-mail não ir ao repositório: o painel lê as mensagens de contato, que trazem
 * nome e e-mail de terceiros.
 */
async function grantAdmin(email) {
  const { rows } = await db.query(
    `insert into traco.admins (id, full_name)
     select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
       from auth.users u
      where lower(u.email) = lower($1)
     on conflict (id) do update set full_name = excluded.full_name
     returning full_name`,
    [email],
  );
  if (!rows.length) throw new Error("Nenhuma conta com esse e-mail. Crie a conta no app antes de promovê-la.");
  console.log(`  ${rows[0].full_name} agora administra o estúdio.`);
}

/** Bucket público para leitura; o envio acontece só no servidor, com a chave secreta. */
async function ensureBucket() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL.trim(), process.env.SUPABASE_SECRET_KEY.trim(), {
    auth: { persistSession: false },
  });
  const { data: existentes } = await admin.storage.listBuckets();
  if (existentes?.some((b) => b.name === BUCKET)) {
    console.log(`  bucket ${BUCKET} já existia`);
    return;
  }
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "6MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
  if (error) throw new Error(`Não criei o bucket: ${error.message}`);
  console.log(`  bucket ${BUCKET} criado (leitura pública, envio só pelo servidor)`);
}

const command = process.argv[2];
const argument = process.argv[3];
if (!["migrate", "admin", "bucket"].includes(command) || (command === "admin" && !argument)) {
  console.error("Use: node scripts/db.mjs migrate | admin <e-mail> | bucket");
  process.exit(1);
}

await db.connect();
try {
  console.log(
    command === "migrate"
      ? "Aplicando migrações..."
      : command === "admin"
        ? "Dando acesso ao painel..."
        : "Conferindo o Storage...",
  );
  await (command === "migrate" ? migrate() : command === "admin" ? grantAdmin(argument) : ensureBucket());
  console.log("Pronto.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
