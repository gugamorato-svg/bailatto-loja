import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let data = null;
for (let t = 1; t <= 4 && !data; t++) {
  ({ data } = await sb.storage.from("bailatto").download("data/products.json"));
  if (!data) await new Promise((r) => setTimeout(r, 1500));
}
if (!data) { console.error("nao consegui baixar"); process.exit(1); }
const lista = JSON.parse(await data.text());

// A função de título rebaixava palavras de até 2 letras — mas "X" e "V" são
// o nome do modelo, não preposição.
let n = 0;
for (const p of lista) {
  const novo = p.name.replace(/\b([xv])\b/g, (m) => m.toUpperCase());
  if (novo !== p.name) {
    console.log(`  ${p.name}  ->  ${novo}`);
    p.name = novo;
    n++;
  }
}

if (n === 0) { console.log("nada a corrigir"); process.exit(0); }

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
await sb.storage.from("bailatto").upload(`data/backup-products-${carimbo}.json`, JSON.stringify(lista, null, 2), { contentType: "application/json" });
const { error } = await sb.storage.from("bailatto").upload("data/products.json", JSON.stringify(lista, null, 2), { upsert: true, contentType: "application/json" });
if (error) { console.error(error.message); process.exit(1); }
console.log(`${n} nome(s) corrigido(s)`);
