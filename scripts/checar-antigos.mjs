import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await sb.storage.from("bailatto").download("data/products.json");
const list = JSON.parse(await data.text());
const antigos = list.filter((p) => p.category !== "scarpins");
console.log(`${antigos.length} produtos que NAO sao scarpins:\n`);
for (const p of antigos) {
  console.log(`${p.name}`);
  console.log(`   preco R$ ${p.price} | phibo: ${p.phibo ?? "— NAO VINCULADO —"} | estoque: ${p.estoque ? JSON.stringify(p.estoque) : "— SEM ESTOQUE —"}`);
}
