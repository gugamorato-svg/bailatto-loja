import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.storage.from("bailatto").download("data/orders.json");
if (error) { console.log("sem orders.json ainda:", error.message); process.exit(0); }
const list = JSON.parse(await data.text());
const limpo = list.filter(o => !/teste/i.test(o.customer?.name || ""));
await sb.storage.from("bailatto").upload("data/orders.json", JSON.stringify(limpo, null, 2), { upsert: true, contentType: "application/json" });
console.log(`removidos: ${list.length - limpo.length} | restantes: ${limpo.length}`);
