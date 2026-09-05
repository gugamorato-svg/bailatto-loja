<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# BAILATTO Calçados — regras do projeto

Loja real, no ar em https://bailatto.com.br, de uma loja física em São Carlos-SP.
Não é projeto de estudo: **tem cliente comprando e dinheiro em jogo.**

Mais de um agente de IA mexe neste repositório. Antes de editar, rode
`git status` e `git log --oneline -5` para ver o que outro agente já mudou.

## Regras que não se quebram

**1. Foto de produto é contrato.** A imagem do card e da página é o item exato
que chega na caixa. Já tentamos edição generativa (Alibaba/Wan) e ela fechou
bico aberto, inventou tiras, trocou cor e virou sapatilha em salto. Para foto,
use só operação determinística: recorte, escala, reposição, troca de fundo.
Nunca IA generativa sobre o produto.

**2. Não invente prova social.** Depoimento, nota, número de avaliação e selo
têm de vir de fonte real e verificável. Avaliação de outra loja não pode
aparecer como se fosse de cliente da Bailatto — engana a consumidora e é
publicidade enganosa (CDC art. 37).

**3. Não invente atributo de produto.** Cor, material, salto e numeração saem
do Phibo. Se o dado não existe, o texto não fala dele.

**4. Escassez só com estoque real.** "Últimas peças" sai de `estoque`, nunca de
número inventado.

**5. Dado de cliente é privado.** Pedidos vivem no bucket `bailatto-privado`
(nome, telefone, e-mail, CPF). Nada de PII em bucket público, URL, log ou
serviço de terceiro. `sendDefaultPii: false` no Sentry.

**6. Chave nunca entra no repositório.** Tudo em `.env.local` (ignorado). Antes
de qualquer commit que toque em script, confira que nenhum valor real foi
colado no código.

## O que quebra sem aparecer no build

Estes já quebraram de verdade. Rode `npm test` antes de publicar.

- **Numeração vs. tamanho único.** Semijoia e acessório têm `sizes: []` e
  `tamanhoUnico: true`. Todo código que olha `sizes.length` precisa tratar
  isso — foi assim que 60 produtos ficaram como "Esgotado" e sumiram do filtro
  de numeração.
- **Frete em três lugares.** Navegador (`checkout/page.tsx`), API
  (`api/frete/route.ts`) e servidor (`checkout/actions.ts`) calculam o pacote.
  Mudou um, mude os três — senão a cliente vê um valor e o pedido grava outro.
- **Calçado é par, acessório é peso.** Um brinco cotado como caixa de sapato
  sai com frete maior que o produto e perde o Mini Envios.
- **Purchase só quando o Pix é confirmado.** O pagamento é manual: disparar a
  conversão no fim do checkout ensina o algoritmo a buscar quem não paga. O
  evento sai de `updateOrder`, na transição para "pago".

## Comandos

```bash
npm run dev            # desenvolvimento
npm run build          # build (rode antes de publicar)
npm test               # Playwright contra a produção
npm run lint
npx vercel deploy --prod --yes
```

`npm test` roda contra https://bailatto.com.br. Para apontar para local:
`BASE_URL=http://localhost:3000 npx playwright test`.

## Estrutura que importa

- `src/lib/products.ts` — tipo `Product`, categorias, `TAMANHO_UNICO`, peso de miudeza
- `src/lib/frete.ts` — cotação SuperFrete e montagem do pacote (server-only)
- `src/lib/freteGratis.ts` — limiar de frete grátis por UF, com o custo medido
- `src/lib/categoriasSeo.ts` — title, description e texto de cada categoria
- `src/lib/orders.ts` — pedidos no bucket privado; dispara a conversão
- `src/lib/rastreamentoServidor.ts` — Conversions API da Meta
- `scripts/` — scripts de catálogo e foto; rodam da raiz do projeto

## Como escrever aqui

Texto de interface em **português do Brasil**, no tom de loja de bairro:
direto, sem jargão de marketing, sem exagero. Comentário no código explica
**por que**, não o que — de preferência citando o caso real que motivou.
