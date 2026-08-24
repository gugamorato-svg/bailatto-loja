import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let data = null;
for (let t = 1; t <= 4 && !data; t++) {
  ({ data } = await sb.storage.from("bailatto").download("data/products.json"));
  if (!data) await new Promise((r) => setTimeout(r, 1500));
}
const produtos = JSON.parse(await data.text());

let ok = 0;
const problemas = [];
for (const p of produtos) {
  const url = "https://bailatto.com.br" + p.image;
  let r;
  for (let t = 1; t <= 3; t++) {
    try { r = await fetch(url, { signal: AbortSignal.timeout(20000) }); break; }
    catch { await new Promise((x) => setTimeout(x, 1000)); }
  }
  if (!r || !r.ok) { problemas.push(`${p.name}: HTTP ${r?.status ?? "sem resposta"}`); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  const m = await sharp(buf).metadata();
  const proporcao = m.width / m.height;
  if (Math.abs(proporcao - 1.5) > 0.02) problemas.push(`${p.name}: proporção ${proporcao.toFixed(2)}`);
  else if (buf.length < 15000) problemas.push(`${p.name}: arquivo muito pequeno (${Math.round(buf.length/1024)}KB)`);
  else ok++;
}
console.log(`${ok} de ${produtos.length} fotos OK (1200x800, servindo no domínio)`);
if (problemas.length) { console.log("\nproblemas:"); for (const x of problemas) console.log(" -", x); }
