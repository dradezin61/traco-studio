// Cria os projetos de demonstração do estúdio: baixa as fotografias da coleção
// gratuita do Unsplash, envia ao Storage e grava projetos e imagens.
//   node scripts/seed-projetos.mjs
// Roda uma vez: projetos já existentes (mesmo slug) são pulados.
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const BUCKET = "traco-projetos";

const PROJETOS = [
  {
    slug: "casa-ventura",
    title: "Casa Ventura",
    summary: "Casa de dois pavimentos reorganizada em torno de um estar contínuo.",
    description:
      "A reforma abriu a parede entre sala, jantar e cozinha, deixando um único ambiente atravessado pela luz da fachada oeste.\n\nO piso de madeira clara segue sem soleira de um extremo ao outro, e os armários altos foram concentrados em uma única parede para que o resto permanecesse livre.",
    category: "Residencial",
    year: 2024,
    location: "São Paulo, SP",
    area_m2: 210,
    sort_order: 1,
    images: [
      { id: "photo-1609081144289-eacc3108cd03", alt: "Sala de estar com sofá branco, poltrona de madeira e luz natural vinda de janela ampla.", credit: "Jakob Owens", page: "https://unsplash.com/photos/white-sofa-near-brown-wooden-chair-nQBc6clG3X4" },
      { id: "photo-1593696140826-c58b021acf8b", alt: "Mesa de jantar de madeira e sofá cinza em ambiente integrado de planta livre.", credit: "Lotus Design N Print", page: "https://unsplash.com/photos/living-room-with-dining-area-wRzBarqn3hs" },
      { id: "photo-1502005097973-6a7082348e28", alt: "Cozinha com ilha central de madeira clara e portas de vidro ao fundo.", credit: "Jason Briscoe", page: "https://unsplash.com/photos/white-wooden-kitchen-island-and-cupboard-cabinets-near-glass-panel-door-AQl-J19ocWE" },
    ],
  },
  {
    slug: "apartamento-ipe",
    title: "Apartamento Ipê",
    summary: "Interiores de um apartamento de 96 m², resolvidos em marcenaria.",
    description:
      "Quase tudo neste projeto é marcenaria: a cozinha, a estante do estar e o painel que esconde a área de serviço usam a mesma madeira e o mesmo desenho de puxador.\n\nA decisão barateou a obra e deixou o apartamento com uma leitura só, do hall à varanda.",
    category: "Interiores",
    year: 2023,
    location: "Santo André, SP",
    area_m2: 96,
    sort_order: 2,
    images: [
      { id: "photo-1512916194211-3f2b7f5f7de3", alt: "Cozinha com armários de madeira escura e bancada clara.", credit: "Frames For Your Heart", page: "https://unsplash.com/photos/brown-wooden-kitchen-cabinet-JDBVXignFdA" },
      { id: "photo-1610177534644-34d881503b83", alt: "Armário de madeira junto a uma parede clara, com objetos sobre a bancada.", credit: "Jean-Philippe Delberghe", page: "https://unsplash.com/photos/brown-wooden-cabinet-near-brown-wooden-cabinet-4jxGry4pXtc" },
      { id: "photo-1622527561244-74e49a3878a1", alt: "Vaso de cerâmica azul sobre mesa de madeira, em detalhe do estar.", credit: "Max Harlynking", page: "https://unsplash.com/photos/blue-ceramic-vase-on-brown-wooden-table-kAbOlQRY78s" },
    ],
  },
  {
    slug: "cafe-ruina",
    title: "Café Ruína",
    summary: "Cafeteria de esquina que manteve à vista a alvenaria do prédio antigo.",
    description:
      "O projeto preservou a alvenaria original e concentrou o novo em três elementos: o balcão, a iluminação pendente e as mesas de madeira maciça.\n\nO salão comporta 32 lugares sem bloquear a vitrine, que continua sendo a melhor propaganda da casa.",
    category: "Comercial",
    year: 2025,
    location: "São Paulo, SP",
    area_m2: 78,
    sort_order: 3,
    images: [
      { id: "photo-1554118811-1e0d58224f24", alt: "Salão de cafeteria com balcão de madeira e banquetas altas.", credit: "daan evers", page: "https://unsplash.com/photos/interior-of-a-coffee-shop-tKN1WXrzQ3s" },
      { id: "photo-1555396273-367ea4eb4db5", alt: "Mesas de madeira maciça e parede de tijolo aparente no interior da cafeteria.", credit: "Shawn", page: "https://unsplash.com/photos/interior-of-rustic-cafe-with-wooden-tables-nmpW_WwwVSc" },
      { id: "photo-1511081692775-05d0f180a065", alt: "Lâmpadas pendentes sobre mesa comprida, em ambiente de cafeteria.", credit: "Clifford", page: "https://unsplash.com/photos/cafe-interior-with-hanging-bulbs-and-table-VobvKmG-StA" },
    ],
  },
  {
    slug: "escritorio-aldeia",
    title: "Escritório Aldeia",
    summary: "Escritório de 140 m² dividido por painéis de madeira e vidro.",
    description:
      "Em vez de paredes, o escritório foi dividido por painéis de madeira com caixilhos de vidro, que isolam o som das reuniões sem fechar a vista para as janelas.\n\nAs estações de trabalho ficaram no perímetro, e o miolo abriga copa, armários e uma mesa longa de uso livre.",
    category: "Comercial",
    year: 2024,
    location: "Campinas, SP",
    area_m2: 140,
    sort_order: 4,
    images: [
      { id: "photo-1704655295066-681e61ecca6b", alt: "Mesa de trabalho de madeira com cadeira e vaso de flores, junto à janela.", credit: "Francesco Liotti", page: "https://unsplash.com/photos/a-desk-with-a-chair-and-a-vase-of-flowers-3HP6_D9hxFY" },
      { id: "photo-1704655295887-d0b2547c2249", alt: "Sala fechada por painéis de madeira com portas de vidro.", credit: "Francesco Liotti", page: "https://unsplash.com/photos/a-room-with-wooden-walls-and-glass-doors-6fHk5fEsUGU" },
      { id: "photo-1716703432522-d6d2aab1c993", alt: "Parede revestida de madeira com banco corrido ao longo dela.", credit: "Musemind UX Agency", page: "https://unsplash.com/photos/a-room-with-a-wooden-wall-and-a-bench-Yw4KXeKBVnA" },
    ],
  },
];

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL.trim(), process.env.SUPABASE_SECRET_KEY.trim(), {
  auth: { persistSession: false },
  db: { schema: "traco" },
});

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();

try {
  for (const projeto of PROJETOS) {
    const existente = await db.query("select id from traco.projects where slug = $1", [projeto.slug]);
    if (existente.rowCount) {
      console.log(`  já existe   ${projeto.slug}`);
      continue;
    }

    const { rows } = await db.query(
      `insert into traco.projects (slug, title, summary, description, category, year, location, area_m2, sort_order, published)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) returning id`,
      [projeto.slug, projeto.title, projeto.summary, projeto.description, projeto.category, projeto.year, projeto.location, projeto.area_m2, projeto.sort_order],
    );
    const projectId = rows[0].id;

    let ordem = 0;
    for (const imagem of projeto.images) {
      const resposta = await fetch(`https://images.unsplash.com/${imagem.id}?auto=format&fit=crop&w=1600&q=80`);
      if (!resposta.ok) throw new Error(`Falhei ao baixar ${imagem.id}: ${resposta.status}`);
      const arquivo = Buffer.from(await resposta.arrayBuffer());
      const caminho = `projetos/${projeto.slug}/${String(++ordem).padStart(2, "0")}.jpg`;

      const { error } = await admin.storage.from(BUCKET).upload(caminho, arquivo, { contentType: "image/jpeg", upsert: true });
      if (error) throw new Error(`Falhei ao enviar ${caminho}: ${error.message}`);

      await db.query(
        "insert into traco.project_images (project_id, storage_path, alt, sort_order) values ($1, $2, $3, $4)",
        [projectId, caminho, imagem.alt, ordem],
      );
      if (ordem === 1) await db.query("update traco.projects set cover_path = $2 where id = $1", [projectId, caminho]);
      console.log(`     foto     ${caminho} (${(arquivo.length / 1024).toFixed(0)} KB)`);
    }
    console.log(`  criado      ${projeto.slug}`);
  }
  console.log("Pronto.");
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
