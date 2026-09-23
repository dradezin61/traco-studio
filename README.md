# Traço Studio

Site de um estúdio de arquitetura e interiores: galeria de projetos, pedido de
orçamento em etapas com envio de imagens de referência e painel para acompanhar
os pedidos. **Estúdio e projetos fictícios**, criados para demonstrar o sistema;
as fotografias são referências de autores creditados, não obras do estúdio.

Desenvolvido por [Gabriel Andrade](https://gabriel-andrade-omega.vercel.app/).

## O que funciona

**Visitante**
- Galeria com filtro por categoria (residencial, comercial, interiores).
- Página de cada projeto com ficha técnica, sequência de fotografias ampliáveis
  (teclado e botões) e navegação para o projeto anterior e o próximo.
- **Pedido de orçamento em quatro etapas** — ambiente, necessidades, prazo e
  contato — com revisão antes de enviar.
- **Anexos de referência**: até 6 imagens de 6 MB, enviadas direto ao
  armazenamento privado com barra de progresso, remoção e mensagens claras para
  arquivo inválido ou falha de envio.

**Estúdio**
- Painel protegido com a lista de pedidos, contadores e aviso de quando o e-mail
  falhou.
- Detalhe do pedido com as respostas, os anexos (links assinados de 5 minutos) e
  o andamento: recebido, em análise, respondido.
- Botão para reenviar o aviso por e-mail sem duplicar o pedido.

Não há cadastro público nem conta de demonstração: os pedidos trazem nome,
e-mail e imagens de terceiros. O acesso é concedido conta a conta, com
`npm run db:admin -- seu@email`.

## Privacidade dos dados enviados

- As fotografias do catálogo ficam em bucket **público** (`traco-projetos`); os
  anexos dos pedidos, em bucket **privado** (`traco-briefings`).
- Um anexo não abre por URL pública: o painel gera uma URL assinada de 5 minutos
  no servidor, a cada visita.
- `briefings` e `briefing_files` só são legíveis por quem está em `traco.admins`
  (Row Level Security). Trocar o id na URL não revela nada: a regra está no
  banco, não na tela.
- Criar um pedido e registrar um anexo passam por funções executadas pelo
  servidor com a chave secreta, nunca pela API pública.

## Como o pedido é gravado e avisado

1. O visitante envia os anexos ainda como **rascunho**, identificado por um
   cookie próprio (`traco_rascunho`), antes de terminar o formulário.
2. Ao enviar, `traco.submit_briefing` grava o pedido, gera um código curto
   (`TR-XXXX`) e adota os anexos do rascunho.
3. O aviso ao estúdio sai depois da resposta (`after()`), e o resultado fica
   registrado no pedido: `enviado` ou `falhou`, com o motivo.
4. Se falhar, **o pedido continua salvo** e o painel oferece "tentar enviar de
   novo", que reenvia o mesmo aviso sem criar outro pedido.

## Como é feito

- **Next.js 16** (App Router, Server Components e Server Actions), TypeScript e
  Tailwind CSS.
- **Supabase**: Postgres, autenticação e Storage. O banco é dividido com o
  projeto Orbe (o plano gratuito permite dois projetos por conta), mas o estúdio
  vive no schema `traco`, com tabelas, funções e políticas próprias.
- **Brevo** para o aviso por e-mail.
- **Zod** para validação no servidor.

## Rodando localmente

```bash
npm install
cp .env.example .env.local     # preencha com as suas chaves
npm run db:migrate             # schema, tabelas, funções e políticas
npm run db:bucket              # bucket público das fotos dos projetos
node scripts/seed-projetos.mjs # projetos de demonstração com fotos do Unsplash
npm run db:admin -- seu@email  # acesso ao painel (a conta precisa existir)
npm run dev
```

Sem `BREVO_API_KEY`, tudo funciona e o aviso por e-mail fica registrado como
`falhou (sem_configuracao)` — de propósito, para o comportamento de falha ficar
visível em desenvolvimento.

## Estrutura

```
src/
  app/
    page.tsx                  abertura com projetos recentes
    projetos/                 galeria e página de cada projeto
    orcamento/                pedido em etapas e confirmação
    painel/                   lista e detalhe dos pedidos
    briefing-actions.ts       anexos, envio do pedido e aviso por e-mail
    admin-actions.ts          andamento e reenvio do aviso
  components/                 formulário em etapas, galeria ampliável, marca
  lib/                        Supabase, e-mail, imagens, mensagens
supabase/migrations/          schema traco, funções e políticas
scripts/db.mjs                migrações, bucket e acesso ao painel
scripts/seed-projetos.mjs     projetos de demonstração
```

As fontes das fotografias estão em [`docs/fotografias.md`](docs/fotografias.md).
