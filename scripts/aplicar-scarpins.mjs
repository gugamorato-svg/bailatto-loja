import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const BUCKET = "bailatto";
const PATH = "data/products.json";

const novos = JSON.parse(fs.readFileSync("scripts/novos-scarpins.json", "utf8"));

const { data, error } = await sb.storage.from(BUCKET).download(PATH);
if (error) {
  console.error("download:", error.message);
  process.exit(1);
}
const atual = JSON.parse(await data.text());

// backup antes de mexer — dá para voltar atrás se algo sair errado
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
await sb.storage
  .from(BUCKET)
  .upload(`data/backup-products-${carimbo}.json`, JSON.stringify(atual, null, 2), {
    contentType: "application/json",
  });

const antigosScarpins = atual.filter((p) => p.category === "scarpins");
const semScarpins = atual.filter((p) => p.category !== "scarpins");

const final = [...semScarpins, ...novos].map((p, i) => ({ ...p, sort: i }));

const { error: upErr } = await sb.storage
  .from(BUCKET)
  .upload(PATH, JSON.stringify(final, null, 2), {
    upsert: true,
    contentType: "application/json",
  });
if (upErr) {
  console.error("upload:", upErr.message);
  process.exit(1);
}

const porCategoria = {};
for (const p of final) porCategoria[p.category] = (porCategoria[p.category] ?? 0) + 1;

console.log(`backup salvo: data/backup-products-${carimbo}.json`);
console.log(`scarpins antigos removidos: ${antigosScarpins.length}`);
console.log(`scarpins novos adicionados: ${novos.length}`);
console.log(`total no site: ${final.length}`);
console.log("por categoria:", porCategoria);
