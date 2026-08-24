import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await sb.storage.from("bailatto").download("data/products.json");
const lista = JSON.parse(await data.text());

let feitas = 0;
for (const p of lista.filter((x) => x.category !== "scarpins")) {
  const arq = path.join("public", p.image.replace(/^\//, ""));
  if (!fs.existsSync(arq)) { console.log("faltando:", arq); continue; }
  const m = await sharp(arq).metadata();
  if (Math.abs(m.width / m.height - 1.5) < 0.02) continue;
  const tmp = arq.replace(/\.jpg$/, ".tmp.jpg");
  await sharp(arq)
    .resize({ width: 1200, height: 800, fit: "cover", position: sharp.strategy.attention })
    .modulate({ brightness: 1.03 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, arq);
  feitas++;
  console.log(`  ${m.width}x${m.height} -> 1200x800  ${path.basename(arq)}`);
}
console.log(`\n${feitas} fotos reenquadradas`);
