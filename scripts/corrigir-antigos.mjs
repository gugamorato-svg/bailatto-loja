import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { lerCsvPhibo, sugerir } from "../src/lib/phibo.ts";

const APLICAR = process.argv.includes("--aplicar");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const BUCKET = "bailatto";
const PATH = "data/products.json";

const itens = lerCsvPhibo(fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8"));

// Cada categoria do site só pode casar com sua família no Phibo.
const FAMILIA = {
  sandalias: (d) => /SAND[ÁA]LIA/i.test(d) && !/RASTEIRA|PAPETE/i.test(d),
  botas: (d) => /BOTA/i.test(d),
  rasteirinhas: (d) => /RASTEIRA/i.test(d),
  mocassins: (d) => /MOCASSIM|SAPATILHA/i.test(d),
  tenis: (d) => /TENIS/i.test(d),
  papete: (d) => /PAPETE/i.test(d),
  mules: (d) => /SAND[ÁA]LIA|MULE/i.test(d),
};

const CORES = ["branco", "rosa", "marrom", "verde", "preto", "dourado", "prata",
  "nude", "azul", "vermelho", "caramelo", "cinza", "vinho", "bege", "amarelo",
  "laranja", "roxo", "cobre"];
const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const { data, error } = await sb.storage.from(BUCKET).download(PATH);
if (error) { console.error("download:", error.message); process.exit(1); }
const lista = JSON.parse(await data.text());
const antigos = lista.filter((p) => p.category !== "scarpins");

// ---- 1) casar com o Phibo (atribuição global dentro de cada família) ----
const porCategoria = {};
for (const p of antigos) (porCategoria[p.category] ??= []).push(p);

const escolha = new Map();
for (const [cat, produtos] of Object.entries(porCategoria)) {
  const filtro = FAMILIA[cat];
  const candidatosDaFamilia = filtro ? itens.filter((i) => filtro(i.descricao)) : [];
  if (candidatosDaFamilia.length === 0) continue;

  const pares = [];
  for (const p of produtos) {
    for (const s of sugerir(p.name, candidatosDaFamilia, 10)) {
      pares.push({ slug: p.slug, item: s.item, score: s.score });
    }
  }
  pares.sort((a, b) => b.score - a.score);
  const ocupado = new Set();
  for (const c of pares) {
    if (escolha.has(c.slug) || ocupado.has(c.item.chave)) continue;
    if (c.score < 0.5) continue;
    escolha.set(c.slug, c.item);
    ocupado.add(c.item.chave);
  }
}

console.log("=== vínculo com o Phibo ===\n");
const mudancas = [];
for (const p of antigos) {
  const item = escolha.get(p.slug);
  if (!item) {
    console.log(`!! ${p.name}\n   sem correspondente no Phibo — preço R$ ${p.price} fica como está\n`);
    continue;
  }
  const corFoto = CORES.find((c) => semAcento(p.name).includes(c));
  const corItem = semAcento(item.cor || "");
  const corOk = !corFoto || !corItem || corFoto === corItem;

  const estoque = {};
  if (corOk) for (const [t, q] of Object.entries(item.tamanhos)) if (q > 0) estoque[t] = q;
  const tamanhos = Object.keys(estoque).map(Number).sort((a, b) => a - b);

  const mudouPreco = p.price !== item.preco;
  console.log(`${corOk ? "OK" : "??"} ${p.name}`);
  console.log(`   ${item.descricao} / ${item.cor}`);
  console.log(`   preço: R$ ${p.price} ${mudouPreco ? `→ R$ ${item.preco}` : "(igual)"}`);
  console.log(`   estoque: ${tamanhos.length ? tamanhos.map((t) => `${t}:${estoque[t]}`).join(" ") : corOk ? "zerado" : "cor não confere — não herdei"}\n`);

  mudancas.push({ slug: p.slug, preco: item.preco, estoque: tamanhos.length ? estoque : null, tamanhos, phibo: item.chave, phiboDesc: `${item.descricao} / ${item.cor}` });
}

// ---- 2) reprocessar as fotos antigas em 3:2 com corte guiado pelo conteúdo ----
console.log("=== fotos ===");
let refeitas = 0;
for (const p of antigos) {
  const arquivo = path.join("public", p.image.replace(/^\//, ""));
  if (!fs.existsSync(arquivo)) { console.log(`   faltando: ${arquivo}`); continue; }
  const meta = await sharp(arquivo).metadata();
  if (Math.abs(meta.width / meta.height - 1.5) < 0.02) continue; // já está 3:2
  if (!APLICAR) { refeitas++; continue; }
  const tmp = arquivo.replace(/\.jpg$/, ".tmp.jpg");
  await sharp(arquivo)
    .resize({ width: 1200, height: 800, fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, arquivo);
  refeitas++;
}
console.log(`   ${refeitas} foto(s) ${APLICAR ? "reprocessadas" : "a reprocessar"} para 3:2\n`);

if (!APLICAR) {
  console.log("PRÉVIA — rode com --aplicar para gravar.");
  process.exit(0);
}

for (const m of mudancas) {
  const i = lista.findIndex((p) => p.slug === m.slug);
  if (i < 0) continue;
  lista[i] = {
    ...lista[i],
    price: m.preco,
    estoque: m.estoque,
    sizes: m.tamanhos.length ? m.tamanhos : lista[i].sizes,
    phibo: m.phibo,
    phiboDesc: m.phiboDesc,
  };
}

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
await sb.storage.from(BUCKET).upload(`data/backup-products-${carimbo}.json`, JSON.stringify(lista, null, 2), { contentType: "application/json" });
const { error: upErr } = await sb.storage.from(BUCKET).upload(PATH, JSON.stringify(lista, null, 2), { upsert: true, contentType: "application/json" });
if (upErr) { console.error("upload:", upErr.message); process.exit(1); }
console.log(`aplicado: ${mudancas.length} produtos vinculados ao Phibo (backup ${carimbo})`);
