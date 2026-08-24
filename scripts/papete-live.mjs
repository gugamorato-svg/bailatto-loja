import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = "bailatto", PATH = "data/products.json";

const NEW = {
  "sandalia-flatform-rose-strass": {
    slug: "papete-rose-strass-cristal",
    name: "Papete Rosé com Tiras de Strass Cristal",
    description: "Conforto de verdade com muito brilho: tiras cravejadas de strass cristal sobre um solado flatform rosé macio. A papete perfeita para o verão, do passeio ao fim de tarde.",
  },
  "sandalia-flatform-rose-strass-2": {
    slug: "papete-rose-strass-dourado",
    name: "Papete Rosé com Tiras de Strass Dourado",
    description: "O charme do strass rosé-dourado em uma papete leve e confortável. Solado flatform que abraça o pé e combina com tudo — sofisticada sem abrir mão do conforto.",
  },
};

const { data, error } = await sb.storage.from(BUCKET).download(PATH);
if (error) { console.error("download:", error.message); process.exit(1); }
let list = JSON.parse(await data.text());

const moved = [];
for (const p of list) {
  const n = NEW[p.slug];
  if (!n) continue;
  p.slug = n.slug; p.name = n.name; p.description = n.description;
  p.category = "papete"; p.price = 89.90;
  moved.push(p.slug);
}
// move as papetes para o fim da lista
list = [...list.filter(p => p.category !== "papete"), ...list.filter(p => p.category === "papete")];
list.forEach((p, i) => { p.sort = i; });

const { error: upErr } = await sb.storage.from(BUCKET).upload(PATH, JSON.stringify(list, null, 2), { upsert: true, contentType: "application/json" });
if (upErr) { console.error("upload:", upErr.message); process.exit(1); }

const cont = {};
for (const p of list) cont[p.category] = (cont[p.category] || 0) + 1;
console.log("reclassificados:", moved);
console.log("por categoria:", cont, "| total:", list.length);
