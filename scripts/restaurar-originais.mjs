// Restaura TODAS as fotos do site para as originais reais (as 3:2 preservadas
// em _orig, extraídas do Git antes do experimento com IA). Copia para
// public/produtos/ e sobe no bucket. Desfaz por completo a edição com IA.
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const slugs = readFileSync(new URL("_restaurar.txt", raiz), "utf8").split("\n").filter(Boolean);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let ok = 0, erros = 0;
for (const slug of slugs) {
  try {
    const buf = readFileSync(new URL(`_orig/public/produtos/${slug}.jpg`, raiz));
    // 1) arquivo local (Vercel serve daqui)
    writeFileSync(new URL(`public/produtos/${slug}.jpg`, raiz), buf);
    // 2) bucket público
    const { error } = await sb.storage.from("bailatto")
      .upload(`produtos/${slug}.jpg`, buf, { contentType: "image/jpeg", upsert: true });
    if (error) throw new Error(error.message);
    ok++;
    if (ok % 25 === 0) console.log(`  ...${ok}`);
  } catch (e) {
    erros++;
    console.error(`  ✗ ${slug}: ${e.message.slice(0, 90)}`);
  }
}
console.log(`\nrestauradas: ${ok} | erros: ${erros}`);
