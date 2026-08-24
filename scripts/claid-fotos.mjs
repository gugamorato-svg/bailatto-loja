// Gera foto de estúdio para um produto usando o Claid.
// Uso: node scripts/claid-fotos.mjs <slug> [slug2 ...]
//
// São DUAS chamadas por foto:
//   1) /v1/image/edit  → recorta o sapato (precisa de color:"transparent",
//      senão volta achatado em branco e a cena vira um cartão colado)
//   2) /v1/scene/create → gera o ambiente ao redor do recorte
//
// Assinatura grátis: 1 imagem por chamada, poucos produtos por vez.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const CHAVE = env.CLAID_API_KEY;
if (!CHAVE) throw new Error("CLAID_API_KEY não está no .env.local");

mkdirSync(new URL("../teste-claid/", import.meta.url), { recursive: true });

/**
 * Cetim harmonizando com o sapato, sempre num tom mais suave e dessaturado
 * que o produto — ele acompanha, não compete.
 *
 * `claro: true` marca sapato claro: aí o cetim tem de ser um pouco MAIS
 * fechado que o fundo, senão o produto se dissolve na imagem.
 */
const PALETA = {
  preto: { cetim: "soft pearl grey", petalas: "pale blush pink", claro: false },
  branco: { cetim: "warm sand beige", petalas: "dusty rose", claro: true },
  "off-white": { cetim: "warm taupe beige", petalas: "dusty rose", claro: true },
  nude: { cetim: "soft rosé beige", petalas: "dusty rose", claro: true },
  bege: { cetim: "soft camel beige", petalas: "dusty rose", claro: true },
  marrom: { cetim: "warm champagne beige", petalas: "pale peach", claro: false },
  caramelo: { cetim: "soft champagne", petalas: "pale peach", claro: false },
  cobre: { cetim: "muted terracotta", petalas: "pale peach", claro: false },
  dourado: { cetim: "pale champagne gold", petalas: "ivory", claro: true },
  prata: { cetim: "cool pearl grey", petalas: "soft white", claro: true },
  cinza: { cetim: "soft blue-grey", petalas: "pale blush pink", claro: false },
  azul: { cetim: "soft dusty blue", petalas: "pale blush pink", claro: false },
  "azul-escuro": { cetim: "soft dusty blue", petalas: "pale blush pink", claro: false },
  "azul-serenity": { cetim: "warm sand beige", petalas: "soft white", claro: true },
  "azul-baby": { cetim: "warm sand beige", petalas: "soft white", claro: true },
  verde: { cetim: "soft sage green", petalas: "ivory", claro: false },
  vermelho: { cetim: "soft antique rose", petalas: "ivory", claro: false },
  vinho: { cetim: "soft antique rose", petalas: "ivory", claro: false },
  rose: { cetim: "soft powder pink", petalas: "ivory", claro: true },
  rosa: { cetim: "soft powder pink", petalas: "ivory", claro: true },
  roxo: { cetim: "muted lavender grey", petalas: "ivory", claro: false },
  laranja: { cetim: "muted apricot", petalas: "ivory", claro: false },
  // Jeans é azul médio dessaturado: bege quente separa melhor que outro azul.
  jeans: { cetim: "warm sand beige", petalas: "soft white", claro: false },
  linho: { cetim: "soft camel beige", petalas: "dusty rose", claro: true },
  // Estampas (onça, cobra, xadrez): cetim liso e neutro, senão briga com o padrão.
  onca: { cetim: "soft camel beige", petalas: "ivory", claro: false },
  cobra: { cetim: "soft taupe", petalas: "ivory", claro: false },
  xadrez: { cetim: "soft dove grey", petalas: "ivory", claro: false },
};

// Mais específico primeiro: "azul-escuro" tem de ganhar de "azul".
const CORES = Object.keys(PALETA).sort((a, b) => b.length - a.length);

const PADRAO = { cetim: "soft cream", petalas: "pale blush pink", claro: false };

export function paletaDoSlug(slug) {
  const achou = CORES.find((c) => slug.includes(c));
  return { cor: achou ?? "—", ...(PALETA[achou] ?? PADRAO) };
}

/**
 * Padrão de catálogo das grandes (Arezzo, Santa Lolla): fundo morto, zero
 * props, sombra de contato quase imperceptível. Tudo para não disputar
 * atenção com o produto.
 */
function promptLimpo(p) {
  const fundo = p.claro
    ? "Seamless soft greige studio backdrop, slightly deeper than the shoe so it separates clearly."
    : "Seamless soft off-white studio backdrop, warm and very light.";

  return [
    "Clean catalogue product photography of a women's shoe.",
    fundo,
    "Completely empty background: no props, no fabric, no flowers, no decoration of any kind.",
    "No visible horizon line, no visible surface edge, no furniture.",
    "The shoe is large in frame and is the only subject.",
    "Lighting: broad soft even studio light, no harsh contrast, no colored light.",
    "A very subtle soft contact shadow directly beneath the shoe.",
    "Crisp, neutral, minimal, premium footwear e-commerce catalogue look.",
  ].join(" ");
}

function montarPrompt(p) {
  // Sapato claro não pode dividir a tonalidade com a superfície, senão some.
  const superficie = p.claro
    ? "The shoe rests on a soft greige surface that is clearly deeper than the shoe, giving real separation."
    : "The shoe rests on a smooth matte off-white surface.";

  return [
    "Minimalist studio product photography of a women's shoe.",
    "Seamless soft off-white backdrop, clean and neutral, no visible horizon line.",
    superficie,
    `Soft ${p.cetim} silk satin fabric draped loosely in the lower corner, gently rippled,`,
    "muted and desaturated so it supports the product instead of competing with it.",
    `A few delicate ${p.petalas} rose petals scattered sparsely on the surface.`,
    "The shoe is the clear focal point: large in frame, crisp and well defined,",
    "with the backdrop and fabric slightly softer in focus than the product.",
    "Lighting: large soft diffused key light, bright and even, very gentle shadows,",
    "clean airy look with no harsh contrast and no colored light.",
    "Subtle soft contact shadow under the shoe so it sits on the surface.",
    "Calm, uncluttered, feminine, high-end e-commerce catalogue look.",
  ].join(" ");
}

const NEGATIVO = [
  "legs, feet, people, mannequin, human body, socks, stockings",
  "extra shoes, duplicated product, text, watermark, logo",
  "marble, stone, wood, dark background, saturated colors, busy background",
  "cluttered, harsh reflections, blown highlights, heavy shadows",
  "product too small, product lost in background, low contrast",
  "pixelated, low quality, distorted, plastic looking",
].join(", ");

async function claid(caminho, corpo) {
  const r = await fetch(`https://api.claid.ai${caminho}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAVE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${caminho} → ${r.status}\n${texto.slice(0, 600)}`);
  return JSON.parse(texto);
}

const NEGATIVO_LIMPO = [
  "legs, feet, people, mannequin, human body, socks, stockings",
  "extra shoes, duplicated product, text, watermark, logo",
  "fabric, satin, silk, flowers, petals, props, decoration, plants",
  "marble, stone, wood, table, furniture, visible surface edge",
  "dark background, saturated colors, busy background, gradient background",
  "harsh reflections, blown highlights, heavy shadows",
  "product too small, low contrast, pixelated, low quality, distorted",
].join(", ");

async function gerar(slug, limpo = false) {
  const imagem = `https://bailatto.com.br/produtos/${slug}.jpg`;
  const p = paletaDoSlug(slug);
  console.log(`\n→ ${slug}`);
  console.log(`  cor detectada: ${p.cor} → cetim ${p.cetim}${p.claro ? " (sapato claro)" : ""}`);

  const recorte = await claid("/v1/image/edit", {
    input: imagem,
    operations: {
      background: {
        // clipping corta na borda do sapato: sem isso sobra moldura vazia e o
        // scale da cena vira loteria.
        remove: { category: "products", clipping: true },
        color: "transparent",
      },
    },
    output: { format: { type: "png" } },
  });

  const cutout = recorte.data?.output?.tmp_url;
  if (!cutout) throw new Error("recorte sem tmp_url");
  console.log("  1/2 recorte ok");

  const cena = await claid("/v1/scene/create", {
    object: {
      image_url: cutout,
      placement_type: "absolute",
      // Sapato grande no quadro: em 0.72 sobrava fundo vazio demais em cima e
      // ele perdia destaque.
      scale: 0.88,
      position: { x: 0.5, y: 0.55 },
    },
    scene: {
      model: "v2",
      prompt: limpo ? promptLimpo(p) : montarPrompt(p),
      negative_prompt: limpo ? NEGATIVO_LIMPO : NEGATIVO,
      aspect_ratio: "3:4",
      preference: "optimal",
    },
    output: { number_of_images: 1, format: "jpeg" },
  });

  const saida = cena.data?.output?.[0];
  if (!saida) throw new Error("cena sem saída");

  const buf = Buffer.from(await (await fetch(saida.tmp_url)).arrayBuffer());
  const nome = `${slug}-claid${limpo ? "-limpo" : ""}.jpg`;
  writeFileSync(new URL(`../teste-claid/${nome}`, import.meta.url), buf);
  console.log(`  2/2 ✓ ${nome}  ${saida.width}x${saida.height}  ${(buf.length / 1024) | 0} KB`);
}

// Só roda a CLI quando chamado direto — assim outros scripts podem importar
// paletaDoSlug() para auditar as cores sem gastar crédito da API.
if (import.meta.main) {
  const args = process.argv.slice(2);
  const limpo = args.includes("--limpo");
  const slugs = args.filter((a) => !a.startsWith("--"));
  if (slugs.length === 0) {
    console.error("uso: node scripts/claid-fotos.mjs [--limpo] <slug> [slug2 ...]");
    process.exit(1);
  }

  for (const s of slugs) {
    try {
      await gerar(s, limpo);
    } catch (e) {
      console.error(`  ✗ ${s}: ${e.message}`);
    }
  }
}
