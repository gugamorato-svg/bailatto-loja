// Edição de fotos com a API da OpenAI (gpt-image-1, endpoint /images/edits).
// Usa a foto ORIGINAL (de _orig) como entrada e gera fundo de estúdio limpo,
// preservando o produto. Salva em fotos-openai/<slug>.png. Não toca no site.
//
//   node scripts/openai-fotos.mjs slug1 slug2 ...     → esses slugs
//   node scripts/openai-fotos.mjs --tudo              → todos que faltam
//
// Precisa em .env.local:  OPENAI_API_KEY=sk-...   (conta com créditos)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const CHAVE = env.OPENAI_API_KEY;
if (!CHAVE) { console.error("Falta OPENAI_API_KEY no .env.local"); process.exit(1); }

const DESTINO = new URL("fotos-openai/", raiz);
mkdirSync(DESTINO, { recursive: true });

const PROMPT = `Foto de produto para catálogo de e-commerce. Coloque o MESMO calçado sobre um fundo de estúdio liso off-white, sem emenda, removendo o fundo original (mesa, tecido). NÃO altere o calçado: preserve a cor exata, o material, o número e a posição de TODAS as tiras, o bico (aberto continua aberto), a altura e o formato do salto (se for raso, mantenha raso), a palmilha e o solado. Não invente nem remova detalhes. Produto grande e centralizado, sombra de contato suave, iluminação clara. Retrato.`;

async function editar(slug) {
  const src = new URL(`_orig/public/produtos/${slug}.jpg`, raiz);
  if (!existsSync(src)) throw new Error("sem original");
  const fd = new FormData();
  fd.set("model", "gpt-image-1");
  fd.set("prompt", PROMPT);
  fd.set("size", "1024x1536");   // retrato 2:3, próximo do cartão 4:5
  fd.set("quality", "medium");
  fd.set("image", new Blob([readFileSync(src)], { type: "image/jpeg" }), `${slug}.jpg`);

  const r = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${CHAVE}` },
    body: fd,
  });
  const texto = await r.text();
  if (!r.ok) {
    const e = new Error(`${r.status}: ${texto.slice(0, 220)}`);
    e.semCredito = r.status === 429 || /quota|billing|insufficient/i.test(texto);
    throw e;
  }
  const j = JSON.parse(texto);
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("resposta sem imagem: " + texto.slice(0, 160));
  return Buffer.from(b64, "base64");
}

const args = process.argv.slice(2);
let slugs = args.filter((a) => !a.startsWith("--"));
if (args.includes("--tudo")) {
  const prods = await (await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`)).json();
  const feitos = new Set(readdirSync(DESTINO).filter((f) => f.endsWith(".png")).map((f) => f.replace(".png", "")));
  slugs = prods.map((p) => p.slug).filter((s) => !feitos.has(s) && existsSync(new URL(`_orig/public/produtos/${s}.jpg`, raiz)));
}

console.log(`gpt-image-1 | ${slugs.length} fotos`);
let ok = 0, erros = 0;
for (const slug of slugs) {
  const t0 = Date.now();
  try {
    const buf = await editar(slug);
    writeFileSync(new URL(`${slug}.png`, DESTINO), buf);
    ok++;
    console.log(`✓ ${String(ok).padStart(3)} ${slug}  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${(buf.length / 1024) | 0}KB`);
  } catch (e) {
    erros++;
    console.error(`✗ ${slug}: ${e.message.slice(0, 150)}`);
    if (e.semCredito) { console.error("\n⚠ Sem crédito/quota na OpenAI. Parando."); break; }
  }
}
console.log(`\nfeitas: ${ok} | erros: ${erros} | em fotos-openai/`);
