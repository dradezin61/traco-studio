// Troca as fotografias dos quatro projetos existentes, sem recriar nada.
//   node scripts/atualiza-galerias.mjs
//
// É repetível: os arquivos novos vão para uma pasta versionada e, se a revisão
// já estiver aplicada, o projeto é pulado. O estado anterior (capa e imagens)
// fica em traco.gallery_backup, e os arquivos antigos continuam no Storage.
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const BUCKET = "traco-projetos";
const REVISAO = "v3";

/** Baixa do Unsplash: `larga` para a galeria, `capa` recortada em 4:5 a partir
   do ponto de interesse da foto — `entropy` acha sozinho, `center` quando o
   assunto está no meio e o recorte automático escolhe mal. */
const ORIGINAL = (id) => `https://images.unsplash.com/${id}?auto=format&fit=max&w=2400&q=80`;
const CAPA = (id, recorte = "entropy") =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=${recorte}&w=1600&h=2000&q=80`;

const PROJETOS = [
  {
    slug: "casa-ventura",
    fotos: [
      { id: "photo-1628744876497-eb30460be9f6", capa: true, alt: "Sala de estar com dois sofás cinza frente a frente, lareira linear embutida e piso de madeira clara.", autor: "Zac Gudakov", pagina: "https://unsplash.com/photos/living-room-with-grey-velvet-sofas-mw_mj-noYHM" },
      { id: "photo-1628745277862-bc0b2d68c50c", alt: "Cozinha com ilha de bancada clara e pendentes de vidro, aberta para a sala de jantar.", autor: "Zac Gudakov", pagina: "https://unsplash.com/photos/white-and-brown-kitchen-counter-UPbYh3A5cdg" },
      { id: "photo-1628744876525-f2678d8af47f", alt: "Sala ampla com lareira acesa, oliveira em vaso e a entrada da casa ao fundo.", autor: "Zac Gudakov", pagina: "https://unsplash.com/photos/white-leather-2-seat-sofa-IOWG5lg7BWc" },
      { id: "photo-1628744876490-19b035ecf9c3", alt: "Estar voltado para o jardim, com porta de correr de vidro e piso de madeira clara.", autor: "Zac Gudakov", pagina: "https://unsplash.com/photos/gray-couch-beside-green-potted-plant-rFTJzGdHH7M" },
    ],
  },
  {
    slug: "apartamento-ipe",
    fotos: [
      { id: "photo-1781249144509-b275faf929f1", capa: true, recorte: "center", alt: "Sala e cozinha integradas, com bancada de pedra, marcenaria de madeira escura e saída para a varanda.", autor: "Irena Oze", pagina: "https://unsplash.com/photos/modern-open-plan-living-room-and-kitchen-with-balcony-access-xdxCPupHXRo" },
      { id: "photo-1781249144389-4174c1164955", alt: "Bancada-ilha de pedra com banquetas brancas, junto à janela da sala.", autor: "Irena Oze", pagina: "https://unsplash.com/photos/modern-kitchen-with-dark-cabinets-stone-countertops-and-breakfast-bar-Tf5QDU9xxMU" },
      { id: "photo-1781249144427-b675cf4fd2ad", alt: "Bancada da cozinha em pedra com banquetas e a circulação para o hall ao fundo.", autor: "Irena Oze", pagina: "https://unsplash.com/photos/modern-kitchen-interior-with-a-speckled-island-and-bar-stools-KEpu5uC9KmM" },
      { id: "photo-1781249144237-1946dd3e0389", alt: "Armários altos de madeira escura e bancada de pedra, vistos do corredor.", autor: "Irena Oze", pagina: "https://unsplash.com/photos/modern-kitchen-with-wooden-cabinets-and-gray-speckled-countertops-qPynum3-0jM" },
      { id: "photo-1781249144416-46a743be97a0", alt: "Detalhe da cuba embutida na bancada de pedra, com o mesmo revestimento na parede.", autor: "Irena Oze", pagina: "https://unsplash.com/photos/modern-kitchen-with-gray-speckled-countertops-wooden-cabinets-and-sink-WW94FE8SbUY" },
    ],
  },
  {
    slug: "cafe-ruina",
    fotos: [
      { id: "photo-1769986929344-e7960cd2f1d4", capa: true, alt: "Balcão revestido de cerâmica terracota, com vitrine de doces e máquina de espresso.", autor: "Haberdoedas", pagina: "https://unsplash.com/photos/a-cafe-counter-with-pastries-and-coffee-machine-qFSjZ0CVsFI" },
      { id: "photo-1774758959178-094de5122e29", alt: "Salão de pé-direito alto, com parede de tijolo aparente e janelas altas de madeira.", autor: "Palina Kharlanovich", pagina: "https://unsplash.com/photos/interior-of-a-coffee-shop-with-large-windows--tj3iZu5wvQ" },
      { id: "photo-1788404804977-517ab54bd930", alt: "Prateleiras de madeira com copos empilhados sobre a máquina de espresso.", autor: "Mario Gogh", pagina: "https://unsplash.com/photos/coffee-cups-on-cafe-shelves-zeRaybuVe94" },
      { id: "photo-1788404805053-6333ed913a5e", alt: "Barista preparando café atrás do balcão de madeira, com a vitrine da rua ao fundo.", autor: "Mario Gogh", pagina: "https://unsplash.com/photos/person-preparing-coffee-in-cafe-oSH3bcLnpPU" },
    ],
  },
  {
    slug: "escritorio-aldeia",
    fotos: [
      { id: "photo-1700809888987-cf2b29ecbd2c", capa: true, alt: "Escritório aberto com sala de reunião envidraçada, divisória de madeira com plantas e estações de trabalho.", autor: "Declan Sun", pagina: "https://unsplash.com/photos/an-office-with-a-plant-in-the-middle-of-the-room-fftMS_6sRHo" },
      { id: "photo-1656646424763-145e4956a416", alt: "Estações de trabalho junto à janela, separadas por divisórias de vidro.", autor: "Point3D Commercial Imaging Ltd.", pagina: "https://unsplash.com/photos/a-room-with-a-desk-and-a-chair-wRBotCP7UxU" },
      { id: "photo-1656646424651-95b048b70b1b", alt: "Sala envidraçada e aparador de madeira, com a estrutura do teto aparente.", autor: "Point3D Commercial Imaging Ltd.", pagina: "https://unsplash.com/photos/a-room-with-a-desk-and-chairs-jjAGReggTJ8" },
      { id: "photo-1554232456-8727aae0cfa4", alt: "Corredor de piso de madeira entre salas fechadas por caixilhos de vidro.", autor: "nrd", pagina: "https://unsplash.com/photos/glass-paneled-long-wooden-floored-hallway-c3tNiAb098I" },
    ],
  },
];

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL.trim(), process.env.SUPABASE_SECRET_KEY.trim(), {
  auth: { persistSession: false },
});

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();

async function baixar(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`falhei ao baixar (${resposta.status}) ${url}`);
  const tipo = resposta.headers.get("content-type") ?? "image/jpeg";
  return { arquivo: Buffer.from(await resposta.arrayBuffer()), tipo };
}

try {
  for (const projeto of PROJETOS) {
    const { rows } = await db.query(
      "select id, cover_path from traco.projects where slug = $1",
      [projeto.slug],
    );
    if (!rows.length) {
      console.error(`  ausente    ${projeto.slug} — catálogo diferente do esperado, nada foi alterado`);
      process.exitCode = 1;
      continue;
    }
    const { id: projectId, cover_path: capaAtual } = rows[0];

    if (capaAtual?.includes(`/${REVISAO}/`)) {
      console.log(`  já aplicada ${projeto.slug}`);
      continue;
    }

    // 1. Guarda o estado atual antes de qualquer alteração.
    const { rows: atuais } = await db.query(
      "select storage_path, alt, sort_order from traco.project_images where project_id = $1 order by sort_order",
      [projectId],
    );
    await db.query(
      `insert into traco.gallery_backup (revision, project_slug, cover_path, images)
       values ($1, $2, $3, $4::jsonb)
       on conflict (revision, project_slug) do nothing`,
      [REVISAO, projeto.slug, capaAtual, JSON.stringify(atuais)],
    );

    // 2. Envia os arquivos novos, em pasta versionada (o cache não atrapalha).
    const enviados = [];
    let capaNova = null;
    let ordem = 0;
    for (const foto of projeto.fotos) {
      ordem += 1;
      const nome = `projetos/${projeto.slug}/${REVISAO}/${String(ordem).padStart(2, "0")}.jpg`;
      const { arquivo, tipo } = await baixar(ORIGINAL(foto.id));
      const { error } = await admin.storage.from(BUCKET).upload(nome, arquivo, { contentType: tipo, upsert: true });
      if (error) throw new Error(`falhei ao enviar ${nome}: ${error.message}`);
      enviados.push({ nome, alt: foto.alt, ordem });
      console.log(`     foto     ${nome} (${(arquivo.length / 1024).toFixed(0)} KB)`);

      if (foto.capa) {
        const capa = `projetos/${projeto.slug}/${REVISAO}/capa.jpg`;
        const recorte = await baixar(CAPA(foto.id, foto.recorte));
        const envio = await admin.storage.from(BUCKET).upload(capa, recorte.arquivo, { contentType: recorte.tipo, upsert: true });
        if (envio.error) throw new Error(`falhei ao enviar ${capa}: ${envio.error.message}`);
        capaNova = capa;
        console.log(`     capa 4:5 ${capa} (${(recorte.arquivo.length / 1024).toFixed(0)} KB)`);
      }
    }

    if (!capaNova) throw new Error(`${projeto.slug}: nenhuma fotografia marcada como capa`);

    // 3. Troca os registros em uma transação só.
    await db.query("begin");
    try {
      await db.query("delete from traco.project_images where project_id = $1", [projectId]);
      for (const item of enviados) {
        await db.query(
          "insert into traco.project_images (project_id, storage_path, alt, sort_order) values ($1, $2, $3, $4)",
          [projectId, item.nome, item.alt, item.ordem],
        );
      }
      await db.query("update traco.projects set cover_path = $2, updated_at = now() where id = $1", [
        projectId,
        capaNova,
      ]);
      await db.query("commit");
    } catch (erro) {
      await db.query("rollback");
      throw erro;
    }

    console.log(`  atualizado ${projeto.slug} — ${enviados.length} fotografias`);
  }
  console.log("Pronto.");
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
