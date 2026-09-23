# Fotografias dos projetos

Todas vêm da **coleção gratuita do Unsplash** ([licença](https://unsplash.com/license)),
que permite uso comercial e dispensa atribuição — creditamos mesmo assim.
Nenhuma é do Unsplash+ (a coleção paga) e nenhuma foi gerada por IA: cada arquivo
foi aberto e conferido antes de entrar, e as imagens que eram renderizações 3D
foram descartadas, ainda que estivessem entre os primeiros resultados da busca.

As imagens são **referências visuais** dos conceitos apresentados. O Traço Studio
e seus projetos são fictícios: as fotografias não retratam obras do estúdio nem
de seus autores como clientes.

## Como entram no site

`node scripts/atualiza-galerias.mjs` baixa os originais, envia ao bucket
`traco-projetos` e reescreve a galeria dos quatro projetos existentes — sem
recriar os projetos e sem tocar em orçamentos, contas ou anexos.

- **Versionado.** Os arquivos vão para `projetos/<slug>/<revisão>/`, hoje `v3`.
  Nada é sobrescrito nem apagado: as revisões anteriores continuam no Storage.
- **Repetível.** Rodar de novo não faz nada, porque o script compara a revisão
  com o `cover_path` de cada projeto. Para uma nova leva, muda-se `REVISAO`.
- **Reversível.** Antes de trocar, o estado anterior (capa e lista de imagens,
  com ordem e textos alternativos) é copiado para `traco.gallery_backup`.
- Os IDs dos projetos são preservados: só as fotografias mudam.

`scripts/seed-projetos.mjs` continua servindo apenas para a primeira instalação,
quando ainda não há projeto nenhum no banco; ele pula os slugs já existentes.

Tamanhos: a galeria recebe o original limitado a 2400 px de largura; a capa é um
recorte 4:5 de 1600 × 2000 px, feito a partir do ponto de interesse da foto
(`crop=entropy`, ou `crop=center` quando o automático escolhia mal — é o caso do
Apartamento Ipê). No site, as imagens são servidas pelo otimizador do Next em
qualidade 85, no tamanho que cada espaço realmente ocupa, e em dobro nas telas
de densidade 2×.

## Desfazer

O estado anterior de cada revisão está em `traco.gallery_backup` (`revision`,
`project_slug`, `cover_path`, `images`). Para voltar um projeto, basta reescrever
`traco.projects.cover_path` e `traco.project_images` com o conteúdo guardado — os
arquivos daquela revisão continuam no bucket.

## Casa Ventura

Série do mesmo interior, fotografada por Zac Gudakov. A capa é um recorte da
fotografia 1.

| Ordem | Fotografia | Autor | Original |
| --- | --- | --- | --- |
| 1 | [living room with grey velvet sofas](https://unsplash.com/photos/living-room-with-grey-velvet-sofas-mw_mj-noYHM) | Zac Gudakov | 6240 × 4160 |
| 2 | [white and brown kitchen counter](https://unsplash.com/photos/white-and-brown-kitchen-counter-UPbYh3A5cdg) | Zac Gudakov | 6240 × 4160 |
| 3 | [white leather 2-seat sofa](https://unsplash.com/photos/white-leather-2-seat-sofa-IOWG5lg7BWc) | Zac Gudakov | 6240 × 4160 |
| 4 | [gray couch beside green potted plant](https://unsplash.com/photos/gray-couch-beside-green-potted-plant-rFTJzGdHH7M) | Zac Gudakov | 6240 × 4160 |

## Apartamento Ipê

Série do mesmo apartamento, fotografada por Irena Oze. A capa é um recorte
central da fotografia 1.

| Ordem | Fotografia | Autor | Original |
| --- | --- | --- | --- |
| 1 | [open plan living room and kitchen](https://unsplash.com/photos/modern-open-plan-living-room-and-kitchen-with-balcony-access-xdxCPupHXRo) | Irena Oze | 6699 × 4466 |
| 2 | [kitchen with dark cabinets and breakfast bar](https://unsplash.com/photos/modern-kitchen-with-dark-cabinets-stone-countertops-and-breakfast-bar-Tf5QDU9xxMU) | Irena Oze | 6208 × 4139 |
| 3 | [kitchen interior with speckled island](https://unsplash.com/photos/modern-kitchen-interior-with-a-speckled-island-and-bar-stools-KEpu5uC9KmM) | Irena Oze | 6705 × 4470 |
| 4 | [kitchen with wooden cabinets](https://unsplash.com/photos/modern-kitchen-with-wooden-cabinets-and-gray-speckled-countertops-qPynum3-0jM) | Irena Oze | 6042 × 4028 |
| 5 | [countertops, wooden cabinets and sink](https://unsplash.com/photos/modern-kitchen-with-gray-speckled-countertops-wooden-cabinets-and-sink-WW94FE8SbUY) | Irena Oze | 6711 × 4474 |

## Café Ruína

Não há no acervo gratuito uma série completa de uma mesma cafeteria com o
caráter procurado, então estas quatro fotografias são de espaços diferentes,
escolhidas pela mesma família de materiais — cerâmica, madeira e tijolo. As
fotografias 3 e 4 são do mesmo café.

| Ordem | Fotografia | Autor | Original |
| --- | --- | --- | --- |
| 1 | [cafe counter with pastries](https://unsplash.com/photos/a-cafe-counter-with-pastries-and-coffee-machine-qFSjZ0CVsFI) | Haberdoedas | 7695 × 10260 |
| 2 | [coffee shop with large windows](https://unsplash.com/photos/interior-of-a-coffee-shop-with-large-windows--tj3iZu5wvQ) | Palina Kharlanovich | 4160 × 6240 |
| 3 | [coffee cups on cafe shelves](https://unsplash.com/photos/coffee-cups-on-cafe-shelves-zeRaybuVe94) | Mario Gogh | 4000 × 6000 |
| 4 | [person preparing coffee in cafe](https://unsplash.com/photos/person-preparing-coffee-in-cafe-oSH3bcLnpPU) | Mario Gogh | 4000 × 6000 |

## Escritório Aldeia

Também são espaços diferentes, reunidos pelo mesmo assunto: divisórias de vidro,
madeira e luz natural. As fotografias 2 e 3 são do mesmo escritório.

| Ordem | Fotografia | Autor | Original |
| --- | --- | --- | --- |
| 1 | [an office with a plant in the middle of the room](https://unsplash.com/photos/an-office-with-a-plant-in-the-middle-of-the-room-fftMS_6sRHo) | Declan Sun | 8256 × 5504 |
| 2 | [a room with a desk and a chair](https://unsplash.com/photos/a-room-with-a-desk-and-a-chair-wRBotCP7UxU) | Point3D Commercial Imaging Ltd. | 2880 × 1920 |
| 3 | [a room with a desk and chairs](https://unsplash.com/photos/a-room-with-a-desk-and-chairs-jjAGReggTJ8) | Point3D Commercial Imaging Ltd. | 2880 × 1920 |
| 4 | [glass paneled long wooden floored hallway](https://unsplash.com/photos/glass-paneled-long-wooden-floored-hallway-c3tNiAb098I) | nrd | 3024 × 4032 |
