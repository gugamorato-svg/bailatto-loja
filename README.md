# BAILATTO Calçados

Loja virtual de uma loja de calçados femininos de São Carlos-SP, no ar em
**[bailatto.com.br](https://bailatto.com.br)**.

Não é projeto de estudo: tem cliente comprando, estoque real e pedido chegando.
Isso muda quase toda decisão técnica deste repositório — e é sobre isso que este
README fala.

**Next.js 16 · React 19 · Supabase · Vercel · TypeScript**

---

## O problema

Uma loja física com ~211 produtos, tocada por uma pessoa só, que vendia por
Instagram e WhatsApp. Cada venda custava uma conversa: numeração, foto, preço,
frete, combinação de pagamento. O gargalo não era demanda — era o tempo da dona.

O site precisava resolver isso sem virar um sistema que ela não consegue operar.

## Decisões que valem explicar

### Catálogo em JSON no Storage, não em banco

O catálogo vive como um arquivo no Supabase Storage, lido pelo servidor. Com
algumas centenas de produtos e uma pessoa editando, um Postgres com migrations
seria mais infraestrutura para manter e nenhum ganho real. O painel administrativo
grava o mesmo arquivo — a dona edita preço e estoque sozinha, sem SQL.

O limite é conhecido: isso não escala para milhares de produtos nem para escrita
concorrente. Quando chegar lá, migra.

### Foto de produto é contrato, então nada de IA generativa

A imagem do card é o item exato que vai na caixa. Testamos edição generativa
(Alibaba/Wan) num lote e o resultado foi: bico aberto virou fechado, tiras
inventadas, cor trocada, sapatilha rasa com salto. Bonito e errado — que num
e-commerce vira troca e devolução.

O enquadramento hoje é feito por **medição, não por modelo**:
[`scripts/normalizar-enquadramento.cjs`](scripts/normalizar-enquadramento.cjs)
detecta o contorno do produto com `sharp`, calcula escala e posição, e recompõe
num quadro 4:5 com o produto em 80% da largura e centro óptico a 53% da altura
(medidas tiradas de cards reais de marcas grandes). O pixel do produto é o mesmo
da foto original.

### Frete por tipo de item

O cálculo do pacote separa calçado de miudeza
([`src/lib/frete.ts`](src/lib/frete.ts)). Parece detalhe, mas um brinco cotado
como caixa de sapato de 0,75 kg e 33 cm sai com frete maior que o próprio
produto — e a caixa grande ainda desqualifica automaticamente a modalidade
econômica dos Correios. Corrigir isso derrubou o envio de um acessório em ~37%.

O frete grátis tem limiar por região
([`src/lib/freteGratis.ts`](src/lib/freteGratis.ts)), porque enviar para o Norte
custa o dobro do Sudeste. Os limiares vieram de cotação real medida por UF, não
de chute.

### Tamanho único é um tipo, não um caso especial

Semijoias e acessórios não têm numeração. Modelá-los como "produto com `sizes`
vazio" fez com que aparecessem como **esgotados** e sumissem do filtro de
numeração — 60 produtos invisíveis. Hoje `tamanhoUnico` é explícito no tipo
`Product` e todo caminho que olha numeração precisa tratá-lo.

### A conversão dispara quando o dinheiro entra

O pagamento é Pix manual: a cliente fecha o pedido e paga depois. Disparar o
evento `Purchase` no fim do checkout ensinaria o algoritmo de anúncio a procurar
gente que faz pedido e não paga.

O evento sai pelo **servidor** (Conversions API,
[`src/lib/rastreamentoServidor.ts`](src/lib/rastreamentoServidor.ts)) na
transição do pedido para "pago". Server-side também resolve outra coisa: a maior
parte do tráfego vem do navegador embutido do Instagram, onde o pixel do
navegador perde evento.

### Dados de cliente em bucket privado

Pedidos carregam nome, telefone, e-mail e CPF. Ficam num bucket separado, com
acesso só pela service key no servidor — nunca no bucket público que serve as
fotos (LGPD). O Sentry roda com `sendDefaultPii: false`.

### SEO de categoria

As 12 categorias vivem em `?categoria=x`. Com metadata estático, todas
compartilhavam title, H1 e canonical apontando para `/produtos` — na prática,
pedindo ao Google que ignorasse justamente as páginas com volume de busca.
Hoje cada uma tem os seus, via `generateMetadata` lendo `searchParams`.

## Testes

Playwright cobrindo o caminho do dinheiro, em desktop e mobile
([`e2e/compra.spec.ts`](e2e/compra.spec.ts)). Cada caso existe por um bug que já
aconteceu de verdade — produto sem numeração aparecendo como esgotado, filtro
escondendo acessórios, frete divergente entre navegador e servidor. Nenhum deles
aparece em erro de build ou de tipo; só numa compra real.

```bash
npm test                                        # roda contra a produção
BASE_URL=http://localhost:3000 npx playwright test
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | catálogo e fotos |
| `SUPABASE_SERVICE_ROLE_KEY` | escrita e bucket privado (servidor) |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | painel administrativo |
| `SUPERFRETE_TOKEN` / `LOJA_CEP_ORIGEM` | cotação de frete |
| `NEXT_PUBLIC_META_PIXEL_ID` / `META_CAPI_TOKEN` | Meta Pixel e Conversions API |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | monitoramento de erro |

As de rastreamento são opcionais: sem elas, nenhum script é carregado.

## Estrutura

```
src/app/          rotas (App Router) — loja, checkout, pedido, admin
src/components/   componentes de interface
src/lib/          catálogo, frete, pedidos, rastreamento, SEO
scripts/          catálogo e processamento de foto (rodam da raiz)
e2e/              testes Playwright
```

[`AGENTS.md`](AGENTS.md) tem as regras do projeto — inclusive o que costuma
quebrar sem aparecer no build.

---

Código aberto para consulta. A marca, as fotos e o catálogo são da BAILATTO
Calçados.
