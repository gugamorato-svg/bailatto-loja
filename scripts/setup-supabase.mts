import { createClient } from "@supabase/supabase-js";
import { products } from "../src/lib/products.ts";
import crypto from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("faltam variaveis do supabase"); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = "bailatto";

const { data: buckets, error: lbErr } = await sb.storage.listBuckets();
if (lbErr) { console.error("listBuckets:", lbErr.message); process.exit(1); }
if (!buckets.some((b) => b.name === BUCKET)) {
  const { error } = await sb.storage.createBucket(BUCKET, { public: true });
  if (error) { console.error("createBucket:", error.message); process.exit(1); }
  console.log("bucket criado:", BUCKET);
} else {
  console.log("bucket ja existe:", BUCKET);
}

const seed = products.map((p, i) => ({
  id: crypto.randomUUID(),
  slug: p.slug, name: p.name, category: p.category, description: p.description,
  price: p.price, promoPrice: null, sizes: p.sizes, image: p.image,
  featured: !!p.featured, active: true, sort: i,
}));
const body = new Blob([JSON.stringify(seed, null, 2)], { type: "application/json" });
const { error: upErr } = await sb.storage.from(BUCKET).upload("data/products.json", body, { upsert: true, contentType: "application/json" });
if (upErr) { console.error("upload json:", upErr.message); process.exit(1); }
console.log("seed gravado:", seed.length, "produtos");
