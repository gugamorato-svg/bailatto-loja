// Reverte fotos que a IA alterou: pega a original 3:2 (do _orig/, extraído do
// Git) e reenquadra em 4:5 SEM cortar e SEM IA — produto real completo, com o
// fundo preenchido pela própria foto desfocada (padrão do refazer-todas-fotos).
// Grava em public/produtos/<slug>.jpg e sobe no bucket.
//
//   node scripts/reverter-fotos.mjs           → usa _reverter.txt
//   node scripts/reverter-fotos.mjs slug1 ...  → slugs avulsos
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const L = 1024, A = 1280; // 4:5, igual às fotos de IA

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const slugs = args.length
  ? args
  : readFileSync(new URL("_reverter.txt", raiz), "utf8").split("\n").filter(Boolean);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function reenquadrar(src) {
  // Fundo: a própria foto ampliada e desfocada — some a emenda, preenche o 4:5.
  const fundo = await sharp(src).resize({ width: L, height: A, fit: "cover" })
    .blur(30).modulate({ brightness: 1.04, saturation: 0.6 }).toBuffer();
  // Frente: a foto inteira cabendo dentro do quadro, com MARGEM confortável
  // (80% da largura). Em fotos onde o sapato foi posto na diagonal preenchendo
  // o quadro, 94% fazia ele encostar nas bordas e parecer cortado.
  const frente = await sharp(src)
    .resize({ width: Math.round(L * 0.8), height: Math.round(A * 0.72), fit: "inside" })
    .sharpen({ sigma: 0.5 }).toBuffer();
  const fm = await sharp(frente).metadata();
  return sharp(fundo).composite([{
    input: frente,
    left: Math.round((L - fm.width) / 2),
    top: Math.round((A - fm.height) / 2),
  }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}

let ok = 0, erros = 0;
for (const slug of slugs) {
  const orig = new URL(`_orig/public/produtos/${slug}.jpg`, raiz);
  if (!existsSync(orig)) { console.error(`  ✗ ${slug}: sem original`); erros++; continue; }
  try {
    const jpg = await reenquadrar(readFileSync(orig));
    writeFileSync(new URL(`public/produtos/${slug}.jpg`, raiz), jpg);
    const { error } = await sb.storage.from("bailatto")
      .upload(`produtos/${slug}.jpg`, jpg, { contentType: "image/jpeg", upsert: true });
    if (error) throw new Error(error.message);
    ok++;
    console.log(`  ✓ ${slug}  ${(jpg.length / 1024) | 0}KB`);
  } catch (e) {
    erros++;
    console.error(`  ✗ ${slug}: ${e.message.slice(0, 90)}`);
  }
}
console.log(`\nrevertidas: ${ok} | erros: ${erros}`);
