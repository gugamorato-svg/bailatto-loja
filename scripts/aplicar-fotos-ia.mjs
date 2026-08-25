// Troca as fotos do site pelas versões editadas com IA (fotos-ia/*.png).
// Converte PNG 4:5 → JPG, grava em public/produtos/<slug>.jpg E sobe no bucket
// público do Supabase (mesma imagem que o site serve).
//
// As originais 3:2 ficam salvas no histórico do Git — para reverter uma foto
// marcada para retoque, basta `git checkout <commit> -- public/produtos/<slug>.jpg`
// e subir de novo.
//
//   node scripts/aplicar-fotos-ia.mjs --dry   → lista o que faria
//   node scripts/aplicar-fotos-ia.mjs         → aplica
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const DRY = process.argv.includes("--dry");

const origem = new URL("fotos-ia/", raiz);
const pngs = readdirSync(origem).filter((f) => f.endsWith(".png") && !f.startsWith("_"));
console.log(`fotos de IA encontradas: ${pngs.length}`);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let ok = 0, erros = 0;
for (const png of pngs) {
  const slug = png.replace(/\.png$/, "");
  try {
    const jpg = await sharp(readFileSync(new URL(png, origem)))
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    if (!DRY) {
      // 1) arquivo local servido pelo Vercel
      writeFileSync(new URL(`public/produtos/${slug}.jpg`, raiz), jpg);
      // 2) bucket público (algumas telas leem direto de lá)
      const { error } = await sb.storage.from("bailatto")
        .upload(`produtos/${slug}.jpg`, jpg, { contentType: "image/jpeg", upsert: true });
      if (error) throw new Error(error.message);
    }
    ok++;
    console.log(`  ${DRY ? "(dry) " : "✓ "}${slug}  ${(jpg.length / 1024) | 0}KB`);
  } catch (e) {
    erros++;
    console.error(`  ✗ ${slug}: ${e.message.slice(0, 100)}`);
  }
}
console.log(`\n${DRY ? "faria" : "trocadas"}: ${ok} | erros: ${erros}`);
console.log("originais 3:2 preservadas no histórico do Git.");
