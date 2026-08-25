// Edição de fotos com o Google Gemini (image). Usa a foto ORIGINAL (de _orig,
// extraída do Git) como entrada e gera fundo de estúdio limpo, preservando o
// produto. Salva em fotos-gemini/<slug>.png. Não toca no site.
//
//   node scripts/gemini-fotos.mjs slug1 slug2 ...
//   node scripts/gemini-fotos.mjs --modelo gemini-3-pro-image slug1
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const CHAVE = env.GEMINI_API_KEY;
if (!CHAVE) throw new Error("Falta GEMINI_API_KEY no .env.local");

const args = process.argv.slice(2);
const modelo = args.includes("--modelo") ? args[args.indexOf("--modelo") + 1] : "gemini-3.1-flash-image";
const slugs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--modelo");

mkdirSync(new URL("fotos-gemini/", raiz), { recursive: true });

const PROMPT = `Edite esta foto de produto para catálogo de e-commerce.
Coloque o MESMO calçado sobre um fundo de estúdio liso off-white, sem emenda, e remova completamente o fundo original (mesa, tecido, bandeja).
REGRA ABSOLUTA: não altere o calçado. Preserve exatamente a cor, o material, TODAS as tiras (número e posição), o bico (aberto ou fechado como está), a altura e o formato do salto, a palmilha e cada detalhe. Se for sapatilha rasa, mantenha rasa. Se o solado tiver cor/estampa, preserve.
Produto grande e centralizado, sombra de contato suave, iluminação clara e uniforme. Enquadramento retrato 4:5. Não invente nem remova nada.`;

async function editar(slug) {
  const src = new URL(`_orig/public/produtos/${slug}.jpg`, raiz);
  if (!existsSync(src)) throw new Error("sem original");
  const b64 = readFileSync(src).toString("base64");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${CHAVE}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: b64 } }, { text: PROMPT }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  const texto = await r.text();
  if (!r.ok) {
    const e = new Error(`${r.status}: ${texto.slice(0, 220)}`);
    e.semCota = r.status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(texto);
    throw e;
  }
  const j = JSON.parse(texto);
  const parte = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
  const dados = parte?.inlineData?.data || parte?.inline_data?.data;
  if (!dados) throw new Error("resposta sem imagem: " + texto.slice(0, 200));
  return Buffer.from(dados, "base64");
}

console.log(`modelo: ${modelo} | fotos: ${slugs.length}`);
let ok = 0, erros = 0;
for (const slug of slugs) {
  const t0 = Date.now();
  try {
    const buf = await editar(slug);
    writeFileSync(new URL(`fotos-gemini/${slug}.png`, raiz), buf);
    ok++;
    console.log(`✓ ${slug}  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${(buf.length / 1024) | 0}KB`);
  } catch (e) {
    erros++;
    console.error(`✗ ${slug}: ${e.message.slice(0, 160)}`);
    if (e.semCota) { console.error("\n⚠ Cota do free acabou. Parando."); break; }
  }
}
console.log(`\nfeitas: ${ok} | erros: ${erros}`);
