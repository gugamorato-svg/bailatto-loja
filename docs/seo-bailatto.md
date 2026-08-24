# Auditoria de SEO — BAILATTO Calçados

**Site:** https://bailatto.com.br
**Stack:** Next.js 16 (App Router) + Vercel
**Data da auditoria:** 22/08/2026
**Auditor:** SEO specialist (análise de páginas ao vivo + leitura do código-fonte em `src/app/`)

---

## 0. Diagnóstico rápido — o estado atual

Verifiquei as páginas ao vivo e li os arquivos de rota. Resumo honesto: **o site está bonito e rápido, mas hoje é praticamente invisível para o Google.**

| Sinal | Status | Evidência |
|---|---|---|
| `robots.txt` | ❌ **404** | `https://bailatto.com.br/robots.txt` retorna HTTP 404 |
| `sitemap.xml` | ❌ **404** | `https://bailatto.com.br/sitemap.xml` retorna HTTP 404 |
| `metadataBase` | ❌ ausente | `src/app/layout.tsx` não define |
| Open Graph / Twitter Card | ❌ **zero tags** | nenhum `openGraph` em nenhuma rota |
| Canonical | ❌ ausente | nenhum `alternates.canonical` |
| JSON-LD (Product / LocalBusiness) | ❌ **zero** | nenhum `<script type="application/ld+json">` |
| `<title>` home | ⚠️ existe mas fraco | "BAILATTO Calçados — Elegância em cada passo" — sem "São Carlos" |
| `<title>` produto | ⚠️ genérico | `${product.name} — BAILATTO` |
| `meta description` /produtos | ❌ ausente | `src/app/produtos/page.tsx` só tem `title` |
| `meta description` produto | ❌ ausente | `generateMetadata` só retorna `title` |
| Páginas de categoria indexáveis | ❌ **não existem** | filtro é client-side em `/produtos`, sem URL própria |
| `lang="pt-BR"` | ✅ ok | `src/app/layout.tsx` |
| Renderização | ⚠️ `force-dynamic` | em `/produtos` **e** `/produtos/[slug]` |

**As duas consequências práticas mais caras hoje:**

1. **Sem sitemap + sem links internos por categoria**, os 125 produtos dependem só do crawl a partir de `/produtos`. O Google vai descobrir devagar e indexar parcialmente.
2. **Sem Open Graph**, todo link colado no WhatsApp e no Instagram aparece como texto pelado (ou uma prévia genérica sem imagem). Como você mesmo diz que o canal principal de distribuição é WhatsApp/Instagram, isso é **perda direta de clique**, todo dia, independente de Google.

---

## 1. Checagem de canibalização (obrigatória antes de qualquer mudança)

Não há Search Console conectado ainda, então usei o método pré-GSC (inventário de URLs + intenção de busca).

**Inventário de URLs que tocam o tema "calçado feminino":**

| URL | H1 atual | Papel no cluster | Palavra-chave primária proposta |
|---|---|---|---|
| `/` | "O par certo combina com você." | **Hub local** | `loja de calçados femininos em São Carlos` |
| `/produtos` | "Nossa Coleção" | **Pilar de catálogo** | `calçados femininos` (catálogo/marca) |
| `/produtos/categoria/[cat]` *(a criar)* | "Scarpins Femininos" etc. | **Satélites de categoria** | `scarpin feminino`, `sandália feminina`… |
| `/produtos/[slug]` (125) | Nome do produto | **Cauda longa** | modelo + cor (ex.: `scarpin slingback preto bico fino`) |

**Veredito: não há canibalização ativa hoje** — justamente porque só existem 2 páginas genéricas e 125 páginas de produto muito específicas. O risco aparece **quando você criar as páginas de categoria**. Regras de fronteira a respeitar:

- ✅ A **home** é a única página que pode usar **"São Carlos"** no `<title>`. Nenhuma categoria ou produto deve disputar o termo local — senão a home perde força no pacote local, que é o ativo mais valioso da loja.
- ✅ `/produtos` **não** deve usar "scarpin", "sandália" nem nenhum nome de categoria no `<title>` ou no H1. Ele fica com "Coleção completa / catálogo". O H1 atual "Nossa Coleção" já respeita isso — **mantenha**.
- ✅ Cada categoria é dona de **exatamente um** termo genérico (`scarpin feminino` → só `/produtos/categoria/scarpins`).
- ✅ Páginas de produto **nunca** usam o termo genérico sozinho no H1. "Scarpin Slingback Preto Bico Fino" é seguro; "Scarpin Feminino" seria canibalização da categoria.
- ⚠️ **Atenção ao slug `mules` rotulado "Chanel"** (`src/lib/products.ts:24`). "Sapato chanel feminino" é um termo de busca real e forte no Brasil, mas a URL é `/mules`. Escolha **um** dono: recomendo rotular a categoria "Chanel (Mule)" e usar o slug `mules`, com o `<title>` cobrindo os dois termos. Não crie duas categorias.

---

## 2. Plano priorizado por retorno sobre esforço

Ordenado por ROI. Faça na ordem.

| # | Ação | Impacto | Esforço | ROI |
|---|---|---|---|---|
| 1 | Open Graph + Twitter Card + `metadataBase` | **Alto** | **Baixo** | 🔥🔥🔥 |
| 2 | `sitemap.ts` + `robots.ts` | **Alto** | **Baixo** | 🔥🔥🔥 |
| 3 | Google Business Profile + JSON-LD LocalBusiness | **Alto** | **Baixo** | 🔥🔥🔥 |
| 4 | Titles + descriptions (home, catálogo, produto) | **Alto** | **Baixo** | 🔥🔥🔥 |
| 5 | JSON-LD Product + BreadcrumbList | **Alto** | **Médio** | 🔥🔥 |
| 6 | Páginas de categoria indexáveis (9 URLs novas) | **Alto** | **Médio** | 🔥🔥 |
| 7 | Canonical em todas as rotas | Médio | Baixo | 🔥🔥 |
| 8 | Trocar `force-dynamic` por ISR | Médio | Baixo | 🔥🔥 |
| 9 | Breadcrumb visual + alt de imagem descritivo | Médio | Baixo | 🔥 |
| 10 | Página `/loja` (endereço, horário, como chegar) | Médio | Médio | 🔥 |
| 11 | Conteúdo editorial (guia de numeração, blog) | Médio | Alto | 🔥 |

---

## PRIORIDADE 1 — Open Graph e Twitter Card

**Impacto: ALTO · Esforço: BAIXO**

### Por que importa
Este é o item de maior retorno imediato do documento inteiro, e **não depende do Google**. Hoje, quando alguém cola `bailatto.com.br/produtos/scarpin-slingback-preto` num grupo de WhatsApp, não aparece foto nem preço — só a URL crua. Com OG configurado, aparece um card com a foto do sapato, o nome e o preço. Em venda por WhatsApp isso muda a taxa de clique de forma brutal. Também é o que o Instagram usa no "link na bio" e nos stories.

### O que fazer

**Arquivo: `src/app/layout.tsx`** — adicione `metadataBase` (sem ele, as URLs de imagem OG saem relativas e **quebram** em todos os crawlers sociais) e os defaults de OG:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://bailatto.com.br"),
  title: {
    default: "BAILATTO Calçados — Sapatos Femininos em São Carlos-SP",
    template: "%s | BAILATTO Calçados",
  },
  description:
    "Loja de calçados femininos em São Carlos-SP. Scarpins, sandálias, botas, rasteirinhas e mocassins a partir de R$ 79,90. Loja física no Centro, na Rua Geminiano Costa, 416.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "BAILATTO Calçados",
    url: "https://bailatto.com.br",
    title: "BAILATTO Calçados — Sapatos Femininos em São Carlos-SP",
    description:
      "Scarpins, sandálias, botas e rasteirinhas a partir de R$ 79,90. Loja física no Centro de São Carlos.",
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

> **Nota sobre o `template`:** ao usar `title.template`, o `title` das rotas filhas passa a ser só o miolo. Isso significa que você deve **remover o sufixo manual `— BAILATTO`** de `produtos/page.tsx` e `produtos/[slug]/page.tsx`, senão vira "Produtos — BAILATTO | BAILATTO Calçados". Os textos da Prioridade 4 já estão escritos considerando isso.

**Imagem OG padrão** — convenção de arquivo do App Router: crie `src/app/opengraph-image.jpg` (1200×630). O Next gera `og:image`, `og:image:width` e `og:image:height` automaticamente e resolve a URL absoluta via `metadataBase`. Use uma foto boa da vitrine ou um card com o logo + "Calçados femininos · São Carlos-SP".

**Imagem OG por produto** — em `src/app/produtos/[slug]/page.tsx`, dentro do `generateMetadata`, aponte para a foto real do produto (o campo `product.image` já existe, ex.: `/produtos/scarpin-slingback-preto.jpg`):

```tsx
openGraph: {
  type: "website",
  title: `${product.name} — R$ ${...}`,
  description: product.description,
  url: `https://bailatto.com.br/produtos/${slug}`,
  images: [{ url: product.image, width: 1200, height: 630, alt: product.name }],
},
twitter: { card: "summary_large_image" },
```

> ⚠️ **Cuidado com a proporção.** As fotos do catálogo são renderizadas em `aspect-[3/2]` na página. O WhatsApp corta a prévia para algo próximo de quadrado e o Facebook/Instagram para 1.91:1. Se as fotos originais forem verticais, o corte pode decapitar o sapato. Vale gerar uma variante 1200×630 por produto — ou, se for muito trabalho, usar `opengraph-image.tsx` com `ImageResponse` para compor foto + nome + preço num canvas 1200×630 fixo. Essa segunda opção resolve o corte e ainda coloca o preço no card do WhatsApp, o que é ótimo para conversão.

### Como validar
Cole a URL no https://developers.facebook.com/tools/debug/ e mande o link para você mesmo no WhatsApp. O WhatsApp cacheia agressivamente — teste com uma URL com `?v=2` se precisar forçar.

---

## PRIORIDADE 2 — `sitemap.ts` e `robots.ts`

**Impacto: ALTO · Esforço: BAIXO**

### Por que importa
Ambos retornam **404 hoje**. Sem sitemap, os 125 produtos só são descobertos por rastreamento a partir de `/produtos` — lento e incompleto. O sitemap é também o que permite enviar o site ao Search Console e acompanhar a cobertura de indexação (que é como você vai medir tudo daqui pra frente).

### O que fazer

**Criar `src/app/robots.ts`** (convenção de arquivo, valida na versão do Next instalada):

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sacola", "/checkout", "/api/"],
    },
    sitemap: "https://bailatto.com.br/sitemap.xml",
  };
}
```

> Ajuste a lista `disallow` para as rotas reais de carrinho/checkout do seu app. Bloquear carrinho evita desperdício de crawl budget em páginas sem valor de busca.

**Criar `src/app/sitemap.ts`** — gere dinamicamente a partir do banco, para os 125 produtos entrarem sozinhos e novos produtos aparecerem sem trabalho manual:

```ts
import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/db";
import { categories } from "@/lib/products";

const BASE = "https://bailatto.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/produtos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/loja`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...categories.map((c) => ({
      url: `${BASE}/produtos/categoria/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${BASE}/produtos/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: [`${BASE}${p.image}`], // sitemap de imagens — ajuda no Google Imagens
    })),
  ];
}
```

O campo `images` é suportado nesta versão e gera o namespace `image:` no XML. Para loja de calçados, **Google Imagens é um canal de tráfego real** — vale a linha extra.

### Depois de publicar
1. Registre a propriedade no **Google Search Console** (verificação por DNS ou pelo arquivo HTML na `public/`).
2. Envie `https://bailatto.com.br/sitemap.xml`.
3. Acompanhe "Páginas > Indexação" semanalmente. Meta realista: **80%+ dos 125 produtos indexados em 6–10 semanas.**

---

## PRIORIDADE 3 — SEO local (o ativo mais valioso desta loja)

**Impacto: ALTO · Esforço: BAIXO**

### Por que importa
Seja honesto sobre a realidade competitiva: **você não vai ranquear para "scarpin feminino" no Brasil.** Esse termo é dominado por Zattini, Marisa, Dakota, Arezzo — domínios com milhares de backlinks. Tentar competir ali é queimar meses.

**Mas "loja de calçados em São Carlos" você pode ganhar.** É um SERP local, decidido pelo pacote de mapas, não por autoridade de domínio nacional. Os concorrentes reais são CM Calçados, Elle e Ella, Zap Calçados e Carlos Calçados — nenhum deles com SEO forte. E você já tem **nota 5,0 no Google**, que é exatamente o sinal que mais pesa no ranqueamento local.

**Este é o item onde seu esforço tem a maior alavancagem de todo o documento.**

### 3.1 Google Business Profile (fora do código — faça isto primeiro)

Não é código, é o passo mais importante. Verifique/reivindique o perfil e preencha **100%**:

- **Nome:** BAILATTO Calçados (exatamente como na fachada — não encha de palavra-chave, é violação de diretriz e derruba o perfil)
- **Categoria principal:** `Loja de calçados`
- **Categorias secundárias:** `Loja de sapatos femininos`, `Loja de artigos de moda`
- **Endereço:** Rua Geminiano Costa, 416 — Centro, São Carlos-SP, 13560-641
- **Telefone/WhatsApp:** (16) 99339-2022
- **Site:** https://bailatto.com.br
- **Horário de funcionamento:** preencha (o site hoje **não informa horário em lugar nenhum** — é a informação nº 1 que quem busca loja física quer)
- **Fotos:** fachada, interior, vitrine e 15–20 produtos. Perfis com muitas fotos recebem significativamente mais cliques de rota e ligação.
- **Produtos:** cadastre os principais direto no perfil, com preço
- **Avaliações:** peça review a cada cliente na loja. Nota 5,0 com **volume** é o que ganha o pacote local.

**Consistência NAP:** o trio Nome-Endereço-Telefone precisa estar **idêntico** (mesma grafia, mesma abreviação) no site, no Google, no Instagram e em qualquer diretório. Divergência de NAP dilui a confiança do sinal local.

### 3.2 JSON-LD LocalBusiness (`ShoeStore`)

Schema.org tem um tipo específico: **`ShoeStore`** (subtipo de `Store` → `LocalBusiness`). Use ele, não o `LocalBusiness` genérico — é mais preciso e ajuda o Google a entender a entidade.

Coloque **só na home** (`src/app/page.tsx`), como um `<script>` no JSX. Não repita em toda página: uma entidade, uma declaração.

```tsx
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ShoeStore",
  "@id": "https://bailatto.com.br/#loja",
  name: "BAILATTO Calçados",
  description:
    "Loja de calçados femininos em São Carlos-SP. Scarpins, sandálias, botas, rasteirinhas, mocassins e sapatilhas.",
  url: "https://bailatto.com.br",
  telephone: "+5516993392022",
  image: "https://bailatto.com.br/opengraph-image.jpg",
  priceRange: "R$ 79,90 - R$ 249,90",
  currenciesAccepted: "BRL",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Geminiano Costa, 416",
    addressLocality: "São Carlos",
    addressRegion: "SP",
    postalCode: "13560-641",
    addressCountry: "BR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -22.0154,   // ⚠️ CONFIRA no Google Maps antes de publicar
    longitude: -47.8911,  // ⚠️ CONFIRA no Google Maps antes de publicar
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "13:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/bailatto.calcados.saocarlos",
  ],
  areaServed: [
    { "@type": "City", name: "São Carlos" },
    { "@type": "City", name: "Ibaté" },
    { "@type": "City", name: "Araraquara" },
    { "@type": "City", name: "Descalvado" },
  ],
};
```

Renderize assim:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
/>
```

> ⚠️ **Dois avisos importantes:**
> 1. **Horários são chute meu** — substitua pelos reais. Horário errado no schema é pior que horário nenhum: gera cliente na porta fechada e avaliação negativa.
> 2. **NÃO adicione `aggregateRating` com a nota 5,0 do Google.** O Google proíbe explicitamente que o site declare como próprias avaliações coletadas em plataformas de terceiros — é motivo de ação manual por spam de dados estruturados. A nota 5,0 já aparece sozinha via Google Business Profile. Mantenha o "★ 5,0 no Google" como texto visível no rodapé (isso é ótimo para conversão), só não marque como schema.

### 3.3 Sinais locais no conteúdo da home

A home hoje tem "A gente te espera no Centro" — bonito, mas invisível para busca. Reforce sem soar robótico:

- Mudar esse H2 para: **"A gente te espera no Centro de São Carlos"**
- Adicionar o endereço completo em texto (não só imagem), com o telefone como `<a href="tel:+5516993392022">`
- Incorporar um mapa do Google Maps (iframe com `loading="lazy"`)
- Adicionar uma linha de área atendida: *"Atendemos São Carlos e região — Ibaté, Araraquara e Descalvado."*

---

## PRIORIDADE 4 — Títulos e meta descriptions (textos prontos)

**Impacto: ALTO · Esforço: BAIXO**

### Por que importa
`/produtos` e as 125 páginas de produto **não têm meta description nenhuma**. Quando falta, o Google inventa um trecho da página — frequentemente pegando o menu ou o texto do botão. Description bem escrita não ranqueia diretamente, mas move CTR, e CTR move posição.

Regras: título 50–60 caracteres, description 150–160.

### Home (`src/app/layout.tsx`)

```
Título:       BAILATTO Calçados — Sapatos Femininos em São Carlos-SP
              (56 caracteres ✅)

Description:  Loja de calçados femininos em São Carlos-SP. Scarpins,
              sandálias, botas e rasteirinhas a partir de R$ 79,90.
              Loja física no Centro, na Rua Geminiano Costa, 416.
              (158 caracteres ✅)
```

Repare que o título atual ("Elegância em cada passo") gasta 22 caracteres com um slogan que **ninguém busca**. Trocar por "Sapatos Femininos em São Carlos-SP" usa o mesmo espaço para captar a intenção local. O slogan continua vivo no H1 e na marca — só não no título.

### Catálogo (`src/app/produtos/page.tsx`)

```
Título:       Coleção Completa — 125 Modelos de Calçados Femininos
              (51 caracteres ✅ — vira "... | BAILATTO Calçados" com o template)

Description:  Veja a coleção completa BAILATTO: 125 modelos de scarpins,
              sandálias, sapatilhas, mocassins, botas e rasteirinhas.
              Preços de R$ 79,90 a R$ 249,90. Entrega em São Carlos.
              (159 caracteres ✅)
```

> **Deconflito:** este título usa "Coleção Completa" como termo primário e cita as categorias apenas na description. Isso é intencional — evita que `/produtos` dispute "scarpin feminino" com a futura `/produtos/categoria/scarpins`.

### Produto (`src/app/produtos/[slug]/page.tsx`)

Torne `generateMetadata` completo. Padrão de texto:

```
Título:       {nome do produto} | BAILATTO Calçados
              ex.: "Scarpin Slingback Preto Bico Fino | BAILATTO Calçados"

Description:  {primeira frase da description} R$ {preço} nos tamanhos
              {menor}–{maior}. Retire na loja em São Carlos ou receba em casa.
```

Implementação:

```tsx
export async function generateMetadata({
  params,
}: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };

  const preco = product.price
    ? `R$ ${product.price.toFixed(2).replace(".", ",")}`
    : "Consulte o preço";
  const nums = product.sizes.length
    ? ` Numeração ${Math.min(...product.sizes)} ao ${Math.max(...product.sizes)}.`
    : "";
  const desc =
    `${product.description.split(". ")[0]}. ${preco}.${nums} ` +
    `Retire na loja em São Carlos-SP ou receba em casa.`;

  return {
    title: product.name,
    description: desc.slice(0, 160),
    alternates: { canonical: `/produtos/${slug}` },
    openGraph: { /* ver Prioridade 1 */ },
  };
}
```

O ganho aqui é **escala**: uma função, 125 descriptions únicas e específicas. Colocar **preço e numeração na description** é decisivo para calçados — é a informação que decide o clique no SERP.

### Categorias (quando criar — Prioridade 6)

| Categoria | Título | Description |
|---|---|---|
| Scarpins (54) | `Scarpin Feminino — 54 Modelos de Salto` | `Scarpins femininos bico fino, verniz, slingback e salto bloco. 54 modelos a partir de R$ 109,90. Loja em São Carlos-SP.` |
| Sandálias (35) | `Sandália Feminina — 35 Modelos de Salto` | `Sandálias femininas de salto bloco, tiras e strass. 35 modelos a partir de R$ 109,90. Retire na loja em São Carlos.` |
| Sapatilhas (9) | `Sapatilha Feminina — Conforto e Elegância` | `Sapatilhas femininas confortáveis em napa e bico fino. 9 modelos a partir de R$ 89,90. Loja física em São Carlos-SP.` |
| Mocassins (9) | `Mocassim Feminino — Bico Fino e Fivela` | `Mocassins femininos bico fino, camurça e fivela dourada. 9 modelos a partir de R$ 89,90. São Carlos-SP.` |
| Rasteirinhas (5) | `Rasteirinha Feminina — Slide e Tira de Dedo` | `Rasteirinhas femininas slide, strass e tira de dedo. A partir de R$ 79,90. Compre em São Carlos-SP.` |
| Botas (4) | `Bota Feminina — Cano Curto e Cano Médio` | `Botas femininas cano curto e médio, camurça e croco. A partir de R$ 189,90. Loja em São Carlos-SP.` |
| Papete (4) | `Papete Feminina — Flatform Confortável` | `Papetes femininas flatform com strass. Conforto para o verão a partir de R$ 89,90. São Carlos-SP.` |
| Tamancos (3) | `Tamanco Feminino — Salto Bloco` | `Tamancos femininos de salto bloco, confortáveis e estilosos. Loja de calçados em São Carlos-SP.` |
| Tênis (2) | `Tênis Feminino Casual — Plataforma e Retrô` | `Tênis femininos casuais, plataforma e retrô. A partir de R$ 109,90. Loja física em São Carlos-SP.` |

---

## PRIORIDADE 5 — Dados estruturados Product e BreadcrumbList

**Impacto: ALTO · Esforço: MÉDIO**

### Por que importa
Com `Product` + `Offer` válidos, o resultado no Google passa a exibir **preço e disponibilidade** direto no SERP. Para e-commerce isso é um dos maiores ganhos de CTR disponíveis, e é elegível para a aba **Google Shopping gratuita**, que traz tráfego qualificado sem custo.

### 5.1 Product (em `src/app/produtos/[slug]/page.tsx`)

```tsx
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: [`https://bailatto.com.br${product.image}`],
  sku: product.phiboCode ?? product.slug,
  category: categoryLabel(product.category),
  brand: { "@type": "Brand", name: "BAILATTO" },
  ...(product.price && {
    offers: {
      "@type": "Offer",
      url: `https://bailatto.com.br/produtos/${product.slug}`,
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: temEstoque
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "BAILATTO Calçados" },
      priceValidUntil: "2027-12-31",
    },
  }),
};
```

Pontos de atenção específicos deste catálogo:

- **`price` pode ser `null`** (`src/lib/products.ts:35` — "a confirmar"). O spread condicional acima evita emitir um `Offer` inválido. Product sem `offers` é válido; Product com `Offer` de preço vazio **gera erro** no Rich Results Test.
- **Tamanhos:** você tem `sizes: number[]` e `stock: Record<string, number>`. O ideal técnico é `ProductGroup` com um `Product` variante por numeração e `size` em cada oferta. Mas isso é bem mais trabalho. **Recomendação pragmática:** comece com `Product` simples + `AggregateOffer` se os preços variarem, e evolua para `ProductGroup` só depois que a indexação estiver saudável. Não deixe o ótimo atrasar o bom.
- **`availability` deve refletir o `stock` real.** Marcar `InStock` em produto esgotado é o erro nº 1 que gera perda de elegibilidade a rich results.
- **Não invente `aggregateRating`** — mesma regra da Prioridade 3. Sem avaliações por produto no site, não declare.

### 5.2 BreadcrumbList

Serve para dois fins: o Google troca a URL crua por uma trilha legível no SERP, e reforça a hierarquia do site.

```tsx
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: "https://bailatto.com.br" },
    { "@type": "ListItem", position: 2, name: "Produtos", item: "https://bailatto.com.br/produtos" },
    {
      "@type": "ListItem",
      position: 3,
      name: categoryLabel(product.category),
      item: `https://bailatto.com.br/produtos/categoria/${product.category}`,
    },
    { "@type": "ListItem", position: 4, name: product.name },
  ],
};
```

> O último item **não leva `item`** — é a página atual, essa é a forma correta.

**Importante:** o schema de breadcrumb precisa ter um **equivalente visual na página**. Hoje a página de produto só tem "← Voltar para a coleção" (`src/app/produtos/[slug]/page.tsx:31`). Troque por uma trilha real `Início / Produtos / Scarpins / Scarpin Slingback Preto`, com links. Isso resolve schema + navegação + link interno para a categoria de uma vez só.

### 5.3 ItemList no catálogo e nas categorias

Em `/produtos` e nas páginas de categoria, adicione `ItemList` com os produtos listados. Ajuda o Google a entender que é uma página de listagem e acelera a descoberta dos itens.

### Validação
Rode toda página nova em https://search.google.com/test/rich-results. Meta: **zero erros**, avisos aceitáveis.

---

## PRIORIDADE 6 — Páginas de categoria indexáveis

**Impacto: ALTO · Esforço: MÉDIO**

### Por que importa
Este é o **maior buraco de arquitetura do site**. Você tem 54 scarpins e 35 sandálias, mas **nenhuma URL** que o Google possa ranquear para "scarpin" ou "sandália". O filtro em `/produtos` é client-side: os botões "Scarpins", "Sandálias" etc. não mudam a URL, então existe **uma única página** onde deveriam existir dez.

Consequências: você perde toda a cauda média (`scarpin preto salto alto`, `sandália salto bloco confortável`), não tem onde colocar texto otimizado por categoria, e não tem alvo para link interno.

### O que fazer

Criar a rota `src/app/produtos/categoria/[categoria]/page.tsx` com `generateStaticParams` a partir do array `categories` de `src/lib/products.ts`:

```tsx
export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}
```

Cada página precisa de:
- **H1 único** por categoria: "Scarpins Femininos", "Sandálias Femininas"… (nunca "Nossa Coleção")
- **Texto introdutório de 100–200 palavras** acima ou abaixo da grade. Sem texto, é página fina e não ranqueia. Escreva sobre os modelos, ocasiões de uso e numeração — você já tem material excelente nas descriptions dos produtos.
- **Grade de produtos** da categoria
- **Link para as outras categorias** (linkagem interna lateral)
- `ItemList` + `BreadcrumbList` em JSON-LD
- Title/description da tabela da Prioridade 4

Mantenha os botões de filtro em `/produtos` como estão para a experiência do usuário, mas faça-os **também** serem `<Link>` para as URLs de categoria — assim usuário e crawler seguem o mesmo caminho.

### Deconflito obrigatório
Ao criar essas 9–10 páginas, confirme: `/produtos` continua com H1 "Nossa Coleção" e título "Coleção Completa". Se algum dia você mudar o H1 de `/produtos` para "Scarpins e Sandálias", cria canibalização imediata com as categorias. Não faça.

---

## PRIORIDADE 7 — Canonical

**Impacto: MÉDIO · Esforço: BAIXO**

Nenhuma rota define canonical hoje. Com `metadataBase` configurado, basta o caminho relativo:

- `layout.tsx` → não defina canonical global (herda errado para todas as filhas)
- `page.tsx` (home) → `alternates: { canonical: "/" }`
- `produtos/page.tsx` → `alternates: { canonical: "/produtos" }`
- `produtos/[slug]/page.tsx` → `alternates: { canonical: `/produtos/${slug}` }`
- categorias → `alternates: { canonical: `/produtos/categoria/${categoria}` }`

Isso protege contra duplicação por parâmetros de UTM (importante: você vai colar links com `?utm_source=instagram`) e por variações de URL na Vercel (domínio `.vercel.app` vs domínio próprio). **Confirme também que `bailatto.vercel.app` redireciona 301 para `bailatto.com.br`** — se as duas versões respondem 200, você está dividindo autoridade entre dois domínios.

---

## PRIORIDADE 8 — Trocar `force-dynamic` por ISR

**Impacto: MÉDIO · Esforço: BAIXO**

`src/app/produtos/page.tsx:9` e `src/app/produtos/[slug]/page.tsx:10` declaram `export const dynamic = "force-dynamic"`. Toda visita — e todo hit do Googlebot — bate no banco e renderiza do zero.

Problemas: TTFB alto degrada o **LCP** (Core Web Vital, fator de ranqueamento), e com 125 produtos o crawl fica lento, o que atrasa a indexação.

Como o catálogo muda por preço/estoque e não a cada segundo, ISR é o encaixe certo:

```tsx
export const revalidate = 3600; // 1 hora
```

E em `produtos/[slug]/page.tsx`, adicione `generateStaticParams` para pré-renderizar os 125 produtos no build. Se o estoque precisar ser exato em tempo real, mantenha só o componente de estoque/carrinho dinâmico e deixe a casca estática — o que o Google lê fica rápido e cacheado.

Depois, meça em https://pagespeed.web.dev/. Metas: **LCP < 2,5s · INP < 200ms · CLS < 0,1**.

---

## PRIORIDADE 9 — Breadcrumb visual e alt de imagem

**Impacto: MÉDIO · Esforço: BAIXO**

**Breadcrumb visual:** substituir o "← Voltar para a coleção" pela trilha completa (ver 5.2). Ganho duplo: suporte ao schema + link interno para a categoria em 125 páginas de uma vez.

**Alt de imagem:** hoje `alt={product.name}` (`produtos/[slug]/page.tsx:39`). Funcional, mas genérico. Para calçados, **Google Imagens é canal de aquisição real**. Enriqueça:

```tsx
alt={`${product.name} — ${categoryLabel(product.category)} feminino BAILATTO, R$ ${...}`}
```

E confirme que as fotos estão em WebP/AVIF abaixo de 100KB (o `next/image` já converte, mas verifique os originais na `public/produtos/`).

**Múltiplas fotos por produto:** hoje é uma imagem só. Adicionar 2–4 ângulos por produto aumenta conversão e dá mais material para o Google Imagens. É a melhoria de maior impacto comercial fora do SEO puro.

---

## PRIORIDADE 10 — Página `/loja`

**Impacto: MÉDIO · Esforço: MÉDIO**

Uma página dedicada à loja física, alvo das buscas locais mais valiosas ("loja de sapatos no centro de São Carlos", "onde comprar scarpin em São Carlos").

Deve conter: endereço completo, **horário de funcionamento** (informação que hoje não existe em lugar nenhum do site), mapa incorporado, referências de localização ("a X metros da praça..."), fotos da fachada e do interior, botão de WhatsApp, formas de pagamento, e política de troca e retirada.

Title: `Nossa Loja no Centro de São Carlos — Endereço e Horários`

Essa página é também a que você linka do Instagram e do Google Business Profile.

---

## PRIORIDADE 11 — Conteúdo editorial

**Impacto: MÉDIO · Esforço: ALTO**

Só depois que o técnico estiver resolvido. Ordem por retorno:

1. **Guia de numeração** (`/guia-de-numeracao`) — como medir o pé, tabela cm → numeração 34–39, quando pedir um número acima. **É o conteúdo de maior valor comercial**: a página de produto hoje manda "dúvidas sobre numeração? fale no WhatsApp" — cada uma dessas mensagens é uma fricção de venda. A página resolve a dúvida, reduz troca e captura busca informacional real.
2. **Trocas, entrega e retirada** — informação que falta no site inteiro. Sinal de confiança (E-E-A-T) e requisito para elegibilidade em recursos de e-commerce do Google.
3. **Guias de escolha** — "Como escolher o scarpin certo para casamento", "Sandália confortável para trabalhar o dia todo". Ancorados nas categorias grandes (scarpins e sandálias, que somam 89 dos 125 produtos).
4. **Sobre a BAILATTO** — história da loja, quem atende. Sinal de E-E-A-T e diferencial que marketplace nenhum tem.

---

## Palavras-chave — mapa de intenção

**Leitura estratégica:** dividir em duas guerras diferentes, com expectativas diferentes.

### Termos locais — ONDE VOCÊ PODE GANHAR 🎯
Volume menor, mas **intenção altíssima** (quem busca assim compra) e competição fraca. Prioridade máxima.

| Termo | Página dona | Viabilidade |
|---|---|---|
| loja de calçados São Carlos | `/` | Alta |
| loja de sapatos femininos São Carlos | `/` | Alta |
| calçados femininos São Carlos SP | `/` | Alta |
| sapataria centro São Carlos | `/loja` | Alta |
| onde comprar scarpin em São Carlos | `/produtos/categoria/scarpins` | Alta |
| loja de sapatos perto de mim | Google Business Profile | Alta (via GBP) |
| bailatto calçados | `/` | Trivial (marca) |

### Termos nacionais — CAUDA LONGA APENAS ⚠️
Head terms (`scarpin feminino`, `sandália feminina`) são dominados por Zattini, Marisa, Dakota e Arezzo. **Não persiga.** Use-os como termo primário das categorias porque é semanticamente correto, mas o tráfego virá da cauda longa:

| Termo de cauda longa | Página dona |
|---|---|
| scarpin slingback preto bico fino | produto específico |
| scarpin verniz sola vermelha | produto específico |
| sandália salto bloco confortável | `/produtos/categoria/sandalias` |
| papete flatform com strass | `/produtos/categoria/papete` |
| mocassim bico fino feminino camurça | `/produtos/categoria/mocassins` |
| bota cano curto camurça caramelo | produto específico |
| sapato chanel feminino salto bloco | `/produtos/categoria/mules` |
| rasteirinha slide strass | `/produtos/categoria/rasteirinhas` |

É exatamente para isso que servem os 125 títulos e descriptions únicos da Prioridade 4: cada produto vira uma aposta barata na cauda longa. Alguns vão pegar.

**Observação sobre "Chanel":** o rótulo da categoria `mules` é "Chanel" (`src/lib/products.ts:24`). Isso é acertado — no Brasil "sapato chanel" tem busca real e muitas lojas usam só "mule". Cubra os dois no título: `Chanel e Mule Feminino — Salto Bloco`.

---

## Cronograma sugerido

| Semana | Entregas |
|---|---|
| 1 | `metadataBase` + OG/Twitter · `robots.ts` · `sitemap.ts` · Search Console |
| 1 | Google Business Profile completo (fotos, horários, produtos) |
| 2 | Titles + descriptions (home, catálogo, 125 produtos) · canonical |
| 3 | JSON-LD: ShoeStore, Product, BreadcrumbList · breadcrumb visual |
| 4 | Páginas de categoria (9 URLs) com texto introdutório |
| 5 | ISR + `generateStaticParams` · otimização de Core Web Vitals |
| 6 | Página `/loja` · guia de numeração · trocas e entrega |
| 8+ | Medir no Search Console · fotos adicionais · conteúdo editorial |

## Como medir

Sem Search Console você está no escuro — **configure na semana 1**, é pré-requisito de tudo.

- **Semana 4:** cobertura de indexação (meta: 80%+ dos 125 produtos)
- **Semana 8:** primeiras impressões para termos locais no Search Console
- **Mês 3:** posições para "loja de calçados São Carlos" — este é o KPI principal
- **Contínuo:** cliques de rota e ligação no Google Business Profile (geralmente o primeiro canal a dar retorno mensurável)

**Expectativa realista:** SEO local com Google Business Profile bem feito costuma dar sinal em 4–8 semanas. SEO orgânico de produto leva 3–6 meses para maturar. O Open Graph (Prioridade 1) é a única coisa aqui com retorno **no mesmo dia** — por isso é a primeira.
