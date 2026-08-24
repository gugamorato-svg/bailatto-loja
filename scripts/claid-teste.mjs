// Teste do Claid em UMA foto, antes de mexer nas 125.
// Uso: node scripts/claid-teste.mjs <slug>
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

const slug = process.argv[2] ?? "scarpin-slingback-azul";
const imagem = `https://bailatto.com.br/produtos/${slug}.jpg`;

// A paleta muda por cor do produto; o resto (superfície premium, luz, espaço
// negativo) é a "camada de luxo" e vale para qualquer cor.
// Fundo neutro de estúdio, no estilo da referência: nada de mármore ou cor
// forte competindo com o sapato. Só cetim e pétalas como toque delicado.
const PROMPT = [
  "Minimalist studio product photography of a women's shoe.",
  "Seamless off-white backdrop, very clean and neutral, no visible horizon line.",
  "The shoe rests on a smooth matte white surface.",
  "Soft cream silk satin fabric draped loosely in the lower corner, gently rippled.",
  "A few delicate pale pink rose petals scattered sparsely on the white surface.",
  "Lighting: large soft diffused light, bright and even, very gentle shadows,",
  "a clean airy high-key look with no harsh contrast and no colored light.",
  "Subtle soft contact shadow under the shoe so it sits on the surface.",
  "Generous negative space, calm and uncluttered editorial composition.",
  "Sharp, delicate, feminine, high-end e-commerce catalogue look.",
].join(" ");

const NEGATIVO = [
  "legs, feet, people, mannequin, human body, socks, stockings",
  "extra shoes, duplicated product, text, watermark, logo",
  "marble, stone, wood, dark background, strong colors, busy background",
  "cluttered, harsh reflections, blown highlights, heavy shadows",
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
  if (!r.ok) {
    console.error(`✗ ${caminho} → ${r.status}`);
    console.error(texto.slice(0, 900));
    process.exit(1);
  }
  return JSON.parse(texto);
}

// ETAPA 1 — recortar o sapato do fundo. Sem isso o Claid trata a foto inteira
// (incluindo o tecido da mesa) como se fosse o produto e cola tudo na cena.
console.log("→ produto:", slug);
console.log("→ origem :", imagem);
console.log("1/2 recortando o fundo…");

const recorte = await claid("/v1/image/edit", {
  input: imagem,
  operations: {
    background: {
      // clipping corta na borda do sapato: sem isso sobra moldura vazia e o
      // scale da cena vira loteria.
      remove: { category: "products", clipping: true },
      // Sem color:"transparent" o Claid preenche de BRANCO — o recorte volta
      // sem alpha e a cena cola um cartão branco em cima do fundo.
      color: "transparent",
    },
  },
  // Precisa ser objeto: como texto o Claid ignora e cai em JPEG, que não tem alpha.
  output: { format: { type: "png" } },
});

const cutout = recorte.data?.output?.tmp_url;
if (!cutout) {
  console.error("não veio tmp_url do recorte:", JSON.stringify(recorte).slice(0, 500));
  process.exit(1);
}
console.log("    ✓ recorte pronto");

writeFileSync(
  new URL(`../teste-claid/${slug}-recorte.png`, import.meta.url),
  Buffer.from(await (await fetch(cutout)).arrayBuffer()),
);

console.log("2/2 gerando a cena…");
const corpo = {
  object: {
    image_url: cutout,
    placement_type: "absolute",
    scale: 0.72,
    position: { x: 0.5, y: 0.58 },
  },
  scene: {
    model: "v2",
    prompt: PROMPT,
    negative_prompt: NEGATIVO,
    aspect_ratio: "3:4",
    preference: "optimal",
  },
  // Plano grátis: 1 imagem por chamada para não queimar crédito à toa.
  output: { number_of_images: 1, format: "jpeg" },
};

const dados = await claid("/v1/scene/create", corpo);
const saidas = dados.data?.output ?? [];
console.log(`    ✓ ${saidas.length} imagem(ns) geradas`);

let i = 0;
for (const s of saidas) {
  i++;
  const buf = Buffer.from(await (await fetch(s.tmp_url)).arrayBuffer());
  const destino = new URL(`../teste-claid/${slug}-claid-${i}.jpg`, import.meta.url);
  writeFileSync(destino, buf);
  console.log(`  ✓ ${slug}-claid-${i}.jpg  ${s.width}x${s.height}  ${(buf.length / 1024) | 0} KB`);
}

// A original, lado a lado, para conferir se o sapato continua o mesmo.
const orig = Buffer.from(await (await fetch(imagem)).arrayBuffer());
writeFileSync(new URL(`../teste-claid/${slug}-original.jpg`, import.meta.url), orig);
console.log(`  ✓ ${slug}-original.jpg (para comparar)`);
