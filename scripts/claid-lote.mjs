// Processa o catálogo inteiro no estilo limpo (fundo neutro, 3:4).
// Retomável: pula o que já existe em fotos-novas/, então dá para rodar em
// levas conforme o crédito do Claid permitir.
//
//   node scripts/claid-lote.mjs            → tudo que falta
//   node scripts/claid-lote.mjs --limite 10 → só as 10 próximas
//   node scripts/claid-lote.mjs --so-faltam → apenas lista o que falta
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const CHAVE = env.CLAID_API_KEY;
const DESTINO = new URL("fotos-novas/", raiz);
mkdirSync(DESTINO, { recursive: true });

const args = process.argv.slice(2);
const limite = args.includes("--limite")
  ? Number(args[args.indexOf("--limite") + 1])
  : Infinity;

const produtos = await (
  await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`,
  )
).json();

const prontos = new Set(
  readdirSync(DESTINO).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, "")),
);

const faltam = produtos.filter((p) => !prontos.has(p.slug));
console.log(`catálogo: ${produtos.length} | prontas: ${prontos.size} | faltam: ${faltam.length}`);

if (args.includes("--so-faltam")) {
  faltam.slice(0, 30).forEach((p) => console.log("  ·", p.slug));
  process.exit(0);
}

// ---- paleta só para decidir claro/escuro; no estilo limpo não há cetim ----
const CLAROS = ["branco", "off-white", "nude", "bege", "prata", "dourado", "linho"];
const ehClaro = (slug) => CLAROS.some((c) => slug.includes(c));

function prompt(claro) {
  const fundo = claro
    ? "Seamless soft greige studio backdrop, clearly deeper in tone than the shoe so the product separates."
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

const NEGATIVO = [
  "legs, feet, people, mannequin, human body, socks, stockings",
  "extra shoes, duplicated product, text, watermark, logo",
  "fabric, satin, silk, flowers, petals, props, decoration, plants",
  "marble, stone, wood, table, furniture, visible surface edge",
  "dark background, saturated colors, busy background, gradient background",
  "harsh reflections, blown highlights, heavy shadows",
  "product too small, low contrast, pixelated, low quality, distorted",
].join(", ");

async function claid(caminho, corpo) {
  const r = await fetch(`https://api.claid.ai${caminho}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CHAVE}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const texto = await r.text();
  if (!r.ok) {
    const e = new Error(texto.slice(0, 300));
    e.status = r.status;
    // Crédito acabou / limite de taxa: parar o lote em vez de queimar tentativas.
    // O Claid devolve error_type "billing" com HTTP 400, então status sozinho não basta.
    e.semCredito =
      r.status === 402 ||
      r.status === 429 ||
      /credit|quota|limit|billing/i.test(texto);
    throw e;
  }
  return JSON.parse(texto);
}

let ok = 0;
let erros = 0;

for (const p of faltam.slice(0, limite)) {
  const origem = `https://bailatto.com.br${p.image}`;
  try {
    const rec = await claid("/v1/image/edit", {
      input: origem,
      operations: {
        background: {
          remove: { category: "products", clipping: true },
          color: "transparent",
        },
      },
      output: { format: { type: "png" } },
    });
    const cutout = rec.data?.output?.tmp_url;
    if (!cutout) throw new Error("recorte sem tmp_url");

    const cena = await claid("/v1/scene/create", {
      object: {
        image_url: cutout,
        placement_type: "absolute",
        scale: 0.88,
        position: { x: 0.5, y: 0.55 },
      },
      scene: {
        model: "v2",
        prompt: prompt(ehClaro(p.slug)),
        negative_prompt: NEGATIVO,
        aspect_ratio: "3:4",
        preference: "optimal",
      },
      output: { number_of_images: 1, format: "jpeg" },
    });

    const saida = cena.data?.output?.[0];
    if (!saida) throw new Error("cena sem saída");

    const buf = Buffer.from(await (await fetch(saida.tmp_url)).arrayBuffer());
    writeFileSync(new URL(`${p.slug}.jpg`, DESTINO), buf);
    ok++;
    console.log(`✓ ${String(ok).padStart(3)} ${p.slug}  ${saida.width}x${saida.height}`);
  } catch (e) {
    erros++;
    console.error(`✗ ${p.slug}: ${e.message.slice(0, 120)}`);
    if (e.semCredito) {
      console.error("\n⚠ Parece que o crédito do Claid acabou. Parando aqui.");
      console.error(`  Rode de novo depois — ele retoma de onde parou.`);
      break;
    }
  }
}

console.log(`\nfeitas agora: ${ok} | erros: ${erros}`);
console.log(`total pronto: ${readdirSync(DESTINO).filter((f) => f.endsWith(".jpg")).length}/${produtos.length}`);
