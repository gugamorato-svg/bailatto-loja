import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = "bailatto", PATH = "data/products.json";
const P = { scarpins:139.90, sandalias:109.90, tamancos:89.90, mocassins:89.90, papete:89.90, rasteirinhas:79.90, botas:189.90, tenis:109.90 };

const { data, error } = await sb.storage.from(BUCKET).download(PATH);
if (error) { console.error("download:", error.message); process.exit(1); }
const list = JSON.parse(await data.text());

let priced = 0, renamed = 0;
for (const p of list) {
  if (P[p.category] !== undefined) { p.price = P[p.category]; priced++; }
  if (p.name.startsWith("Mule ")) { p.name = p.name.replace(/^Mule /, "Chanel "); renamed++; }
}
const { error: upErr } = await sb.storage.from(BUCKET).upload(PATH, JSON.stringify(list, null, 2), { upsert: true, contentType: "application/json" });
if (upErr) { console.error("upload:", upErr.message); process.exit(1); }
console.log(`precos aplicados: ${priced}/${list.length} | renomeados p/ Chanel: ${renamed}`);
console.log("sem preco:", list.filter(p => p.price == null).map(p => p.name));
