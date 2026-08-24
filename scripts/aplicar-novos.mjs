// Publica os 26 produtos novos: constrói o objeto de cada um a partir do
// casamento com o Phibo (_casamento-novos.json), processa a foto do Desktop
// com a MESMA regra do site (refazer-todas-fotos), sobe a imagem e o
// products.json atualizado no Supabase.
//
// Roda só depois de conferido o casamento. --dry mostra o que faria sem gravar.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const DRY = process.argv.includes("--dry");
const PASTA = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";
const L = 1200, A = 800;

const slugify = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const titulo = (t) => t.replace(/\b\w/g, (c) => c.toUpperCase())
  .replace(/\bX\b/gi, "X").replace(/\(\d+\)/g, "").trim().replace(/\s+/g, " ");

// Foto → categoria. Chinelo é categoria nova; "rasteira" (mesmo escrito
// "sandália rasteira") entra em rasteirinhas; o resto é sandália.
function categoria(foto) {
  const f = foto.toLowerCase();
  if (f.startsWith("chinelo")) return "chinelos";
  if (/rasteira/.test(f)) return "rasteirinhas";
  return "sandalias";
}

// Descrição no mesmo tom das existentes, sem inventar atributo. A cor sai do
// Phibo; o tipo, do início do nome.
function descricao(nome, cor, cat) {
  const base = {
    chinelos: "para os dias de calor, com conforto para andar o dia todo",
    rasteirinhas: "leve e confortável, combina com short, vestido e jeans",
    sandalias: "com acabamento caprichado, escolhida a dedo para a nossa coleção",
  }[cat];
  const tipo = nome.split(" ")[0];
  return `${tipo} ${cor.toLowerCase()} ${base}.`;
}

async function processarFoto(origem, destino) {
  const src = readFileSync(origem);
  const m = await sharp(src).metadata();
  const emPe = m.height > m.width;
  const top = emPe ? Math.round(m.height * 0.18) : 0;
  const alt = emPe ? Math.round(m.height * 0.64) : m.height;
  const recorte = { left: 0, top, width: m.width, height: alt };
  const fundo = await sharp(src).extract(recorte).resize({ width: L, height: A, fit: "cover" })
    .blur(28).modulate({ brightness: 1.06, saturation: 0.7 }).toBuffer();
  const frente = await sharp(src).extract(recorte).resize({ width: L, height: A, fit: "inside" })
    .modulate({ brightness: 1.03 }).sharpen({ sigma: 0.6 }).toBuffer();
  const fm = await sharp(frente).metadata();
  const buf = await sharp(fundo).composite([{
    input: frente,
    left: Math.round((L - fm.width) / 2),
    top: Math.round((A - fm.height) / 2),
  }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  if (!DRY) writeFileSync(destino, buf);
  return buf;
}

const casamentos = JSON.parse(readFileSync(new URL("_casamento-novos.json", raiz), "utf8"));

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Catálogo atual
const { data: dl, error: eDl } = await sb.storage.from("bailatto").download("data/products.json");
if (eDl) throw eDl;
const catalogo = JSON.parse(await dl.text());
const slugsExistentes = new Set(catalogo.map((p) => p.slug));
console.log(`catálogo atual: ${catalogo.length} produtos`);

let maxSort = Math.max(...catalogo.map((p) => p.sort ?? 0));
const novos = [];

for (const c of casamentos) {
  const nome = titulo(c.foto);
  const slug = slugify(nome);
  if (slugsExistentes.has(slug)) { console.log(`  · pula (já existe): ${slug}`); continue; }

  const cat = categoria(c.foto);
  const sizes = Object.keys(c.estoque).filter((n) => c.estoque[n] > 0).map(Number).sort((a, b) => a - b);
  const estoque = Object.fromEntries(sizes.map((n) => [String(n), c.estoque[String(n)]]));

  novos.push({
    id: crypto.randomUUID(),
    slug, name: nome, category: cat,
    description: descricao(nome, c.cor, cat),
    price: c.preco, promoPrice: null,
    sizes, estoque,
    phibo: c.phibo,
    phiboDesc: `${c.descricao} / ${c.cor}`,
    image: `/produtos/${slug}.jpg`,
    featured: false, active: true, sort: ++maxSort,
  });

  const buf = await processarFoto(`${PASTA}/${c.foto}.jpg`, new URL(`public/produtos/${slug}.jpg`, raiz));
  console.log(`  + ${slug}  R$${c.preco}  nums ${sizes.join(",")}  foto ${(buf.length / 1024) | 0}KB`);

  // Sobe a foto para o bucket público
  if (!DRY) {
    const { error } = await sb.storage.from("bailatto")
      .upload(`produtos/${slug}.jpg`, buf, { contentType: "image/jpeg", upsert: true });
    if (error) console.error(`    ✗ upload da foto: ${error.message}`);
  }
}

console.log(`\nnovos a publicar: ${novos.length}`);
if (DRY) { console.log("--dry: nada gravado"); process.exit(0); }

const atualizado = [...catalogo, ...novos];
const { error: eUp } = await sb.storage.from("bailatto")
  .upload("data/products.json", JSON.stringify(atualizado, null, 2), {
    contentType: "application/json", upsert: true,
  });
if (eUp) throw eUp;
console.log(`✓ products.json atualizado: ${atualizado.length} produtos no total`);
