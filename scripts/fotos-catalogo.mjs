// Padroniza as fotos do catálogo SEM IA generativa: recorta o fundo localmente
// e compõe sobre um fundo liso, com sombra de contato sintética.
//
// Vantagem sobre gerar cena com IA: o fundo fica exatamente IGUAL nas 125
// (é a mesma cor, não 125 gerações parecidas), custa zero e não há chance de
// o produto ser alterado.
//
//   node scripts/fotos-catalogo.mjs <slug> [slug2 ...]   → só esses
//   node scripts/fotos-catalogo.mjs --tudo               → catálogo inteiro (retomável)
import { removeBackground } from "@imgly/background-removal-node";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import sharp from "sharp";

const raiz = new URL("../", import.meta.url);
const DESTINO = new URL("fotos-novas/", raiz);
const CACHE = new URL("recortes/", raiz);
mkdirSync(DESTINO, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const L = 1200;
const A = 1600; // 3:4 — mais tela vertical no celular, igual à Arezzo

/**
 * UM fundo só para o catálogo inteiro — é o que dá o ar de marca grande.
 * Greige claro: separa tanto o calçado escuro quanto o off-white/nude, sem
 * precisar variar por produto (variar quebraria a consistência).
 */
const FUNDO = { r: 235, g: 231, b: 226 };

/** Quanto da largura o sapato ocupa. Produto grande é requisito do catálogo. */
const OCUPACAO = 0.9;

async function compor(slug, origemUrl) {
  // 1) Recorte (cacheado: o modelo leva ~4s e não muda entre execuções)
  const cacheFile = new URL(`${slug}.png`, CACHE);
  let recorte;
  if (existsSync(cacheFile)) {
    recorte = readFileSync(cacheFile);
  } else {
    const blob = await removeBackground(origemUrl);
    recorte = Buffer.from(await blob.arrayBuffer());
    writeFileSync(cacheFile, recorte);
  }

  // 2) Apara o excesso transparente para o produto encostar nas bordas do
  //    próprio bounding box — só assim OCUPACAO significa alguma coisa.
  const aparado = await sharp(recorte).trim({ threshold: 1 }).toBuffer();

  const produto = await sharp(aparado)
    .resize({
      width: Math.round(L * OCUPACAO),
      height: Math.round(A * 0.72),
      fit: "inside",
    })
    .sharpen({ sigma: 0.7 })
    .toBuffer();
  const pm = await sharp(produto).metadata();

  const esq = Math.round((L - pm.width) / 2);
  // Um pouco abaixo do centro: deixa respiro em cima, como nas marcas grandes.
  const topo = Math.round((A - pm.height) * 0.55);

  // 3) Sombra. O par está deitado, visto de cima — não existe "contato com o
  //    chão" abaixo dele, então a sombra fica sob a silhueta inteira, apenas
  //    deslocada, como objeto apoiado numa superfície com luz vindo de cima.
  //
  //    Montada já no tamanho final: desfocar um recorte justo criava uma
  //    moldura retangular nas bordas. Aqui a borda fica longe do produto.
  const silhuetaCheia = await sharp({
    create: { width: L, height: A, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: produto, left: esq + 10, top: topo + 16 }])
    .extractChannel("alpha")
    .blur(20)
    .linear(0.52, 0)
    // Sem .png() explícito o buffer sai cru e o joinChannel não consegue ler.
    .png()
    .toBuffer();

  const sombra = await sharp({
    create: { width: L, height: A, channels: 3, background: { r: 96, g: 84, b: 78 } },
  })
    .joinChannel(silhuetaCheia)
    .png()
    .toBuffer();

  return sharp({ create: { width: L, height: A, channels: 3, background: FUNDO } })
    .composite([
      { input: sombra, left: 0, top: 0 },
      { input: produto, left: esq, top: topo },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

const args = process.argv.slice(2);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const produtos = await (
  await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`,
  )
).json();

const alvos = args.includes("--tudo")
  ? produtos.filter((p) => !existsSync(new URL(`${p.slug}.jpg`, DESTINO)))
  : produtos.filter((p) => args.includes(p.slug));

if (alvos.length === 0) {
  console.error("nada a fazer — passe slugs ou --tudo");
  process.exit(1);
}

console.log(`processando ${alvos.length} de ${produtos.length}\n`);
let n = 0;
for (const p of alvos) {
  const t0 = Date.now();
  try {
    const buf = await compor(p.slug, `https://bailatto.com.br${p.image}`);
    writeFileSync(new URL(`${p.slug}.jpg`, DESTINO), buf);
    n++;
    console.log(`✓ ${String(n).padStart(3)}/${alvos.length} ${p.slug}  ${(buf.length / 1024) | 0}KB  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.error(`✗ ${p.slug}: ${e.message.slice(0, 110)}`);
  }
}
console.log(`\npronto: ${readdirSync(DESTINO).filter((f) => f.endsWith(".jpg")).length}/${produtos.length}`);
