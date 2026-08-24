import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { lerCsvPhibo, sugerir } from "../src/lib/phibo.ts";

const APLICAR = process.argv.includes("--aplicar");

const FOTOS = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";
const DEST = "public/produtos";
const L = 1200;
const A = 800;

/** Categoria do site a partir do nome do arquivo + a família correspondente no Phibo. */
function classificar(nome) {
  const n = nome.toLowerCase();
  if (n.startsWith("scarpin")) return null; // já cadastrados
  if (n.includes("rasteira")) return { cat: "rasteirinhas", familia: /RASTEIRA/i };
  if (n.startsWith("papete")) return { cat: "papete", familia: /PAPETE/i };
  if (n.startsWith("mocassim")) return { cat: "mocassins", familia: /MOCASSIM/i };
  if (n.startsWith("sapatilha")) return { cat: "sapatilhas", familia: /SAPATILHA/i };
  if (n.startsWith("tamanco")) return { cat: "tamancos", familia: /TAMANCO/i };
  if (n.startsWith("sandália") || n.startsWith("sandalia"))
    return { cat: "sandalias", familia: (d) => /SAND[ÁA]LIA/i.test(d) && !/RASTEIRA|PAPETE/i.test(d) };
  return null;
}

const combina = (familia, desc) =>
  typeof familia === "function" ? familia(desc) : familia.test(desc);

const titulo = (s) =>
  s.split(" ").map((p) => (p.length <= 2 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase())).join(" ");

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const CORES = ["branco", "rosa", "marrom", "verde", "preto", "dourado", "prata",
  "nude", "azul", "vermelho", "caramelo", "cinza", "vinho", "bege", "cobre", "roxo", "laranja"];
const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const corDoNome = (nome) => {
  const t = semAcento(nome).split(/\s+/);
  for (let i = t.length - 1; i >= 0; i--) if (CORES.includes(t[i])) return t[i];
  return null;
};
const corEquivale = (a, b) => a === b || [a, b].every((c) => c === "marrom" || c === "caramelo");

function descrever(nome, cor) {
  const n = nome.toLowerCase();
  const c = (cor || corDoNome(nome) || "").toLowerCase();
  if (n.includes("sapatilha"))
    return `Sapatilha ${c} de bico fino: o conforto de um calçado baixo com a elegância de um scarpin. Para o dia inteiro, sem cansar.`;
  if (n.includes("tamanco") && n.includes("dedo"))
    return `Tamanco de dedo em ${c} — fácil de calçar e confortável, com um toque moderno que combina com vestido e jeans.`;
  if (n.includes("tamanco"))
    return `Tamanco ${c} com fivela: firmeza no passo e muito charme. Ideal para quem quer altura sem abrir mão do conforto.`;
  if (n.includes("papete"))
    return `Papete ${c} de solado macio: o conforto que virou tendência. Perfeita para o verão, do passeio ao fim de tarde.`;
  if (n.includes("mocassim"))
    return `Mocassim ${c} de bico fino — clássico, confortável e coringa. Do escritório ao café da tarde, sempre impecável.`;
  if (n.includes("rasteira"))
    return `Rasteira ${c} leve e confortável, com acabamento caprichado. O básico elegante para os dias quentes.`;
  if (n.includes("glitter") || n.includes("brilho"))
    return `Brilho na medida certa em ${c}: a sandália que ilumina o look e transforma a noite em ocasião especial.`;
  if (n.includes("dedo"))
    return `Sandália de dedo em ${c}: delicada e confortável, alonga a silhueta e combina com tudo no verão.`;
  if (n.includes("bloco"))
    return `Salto bloco em ${c} — o equilíbrio entre altura e conforto. Para ficar horas em pé sem abrir mão do estilo.`;
  if (n.includes("croco"))
    return `Textura croco em ${c} para um look com personalidade. Sofisticada e moderna, do jantar à festa.`;
  if (n.includes("fino"))
    return `Salto fino em ${c}: elegância clássica que afina a silhueta e valoriza qualquer produção.`;
  return `Sandália ${c} com acabamento caprichado, escolhida a dedo para a nossa coleção.`;
}

const itens = lerCsvPhibo(fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8"));

// --- fotos novas (ignora scarpins já cadastrados e os arquivos de referência "_site - ") ---
const arquivos = fs.readdirSync(FOTOS)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .filter((f) => !f.startsWith("_site - "))
  .filter((f) => classificar(path.parse(f).name))
  .sort();

// --- casamento: atribuição global dentro de cada categoria ---
const porCategoria = new Map();
for (const f of arquivos) {
  const { cat } = classificar(path.parse(f).name);
  if (!porCategoria.has(cat)) porCategoria.set(cat, []);
  porCategoria.get(cat).push(f);
}

const escolhido = new Map();
for (const [cat, lista] of porCategoria) {
  const { familia } = classificar(path.parse(lista[0]).name);
  const candidatos = itens.filter((i) => combina(familia, i.descricao));
  const disputa = [];
  for (const f of lista) {
    for (const s of sugerir(path.parse(f).name, candidatos, 10)) {
      disputa.push({ f, item: s.item, score: s.score });
    }
  }
  disputa.sort((a, b) => b.score - a.score);
  const ocupado = new Set();
  for (const d of disputa) {
    if (escolhido.has(d.f) || ocupado.has(d.item.chave)) continue;
    if (d.score < 0.55) continue;
    escolhido.set(d.f, d.item);
    ocupado.add(d.item.chave);
  }
  // sobras usam o melhor candidato mesmo que já tenha dono (2 fotos do mesmo código)
  for (const f of lista) {
    if (escolhido.has(f)) continue;
    const s = sugerir(path.parse(f).name, candidatos, 1);
    if (s[0]) escolhido.set(f, s[0].item);
  }
}

const produtos = [];
const avisos = [];

for (const f of arquivos) {
  const bruto = path.parse(f).name;
  const { cat } = classificar(bruto);
  const item = escolhido.get(f);
  const nome = titulo(bruto);
  const slug = slugify(bruto);

  let preco = null;
  let estoque = null;
  let tamanhos = [34, 35, 36, 37, 38, 39];

  if (!item) {
    avisos.push(`${nome}: sem correspondente no Phibo`);
  } else {
    preco = item.preco;
    const cn = corDoNome(bruto);
    const ci = semAcento(item.cor || "");
    const corEhParteDoModelo = cn && semAcento(item.descricao).includes(cn);
    if (cn && ci && !corEquivale(cn, ci) && !corEhParteDoModelo) {
      avisos.push(`${nome}: cor não confere com ${item.descricao} / ${item.cor} — preço mantido, estoque em aberto`);
    } else {
      const e = {};
      for (const [t, q] of Object.entries(item.tamanhos)) if (q > 0) e[t] = q;
      const ts = Object.keys(e).map(Number).sort((a, b) => a - b);
      if (ts.length) { estoque = e; tamanhos = ts; }
    }
  }

  produtos.push({
    id: crypto.randomUUID(),
    slug, name: nome, category: cat,
    description: descrever(bruto, item?.cor),
    price: preco, promoPrice: null,
    sizes: tamanhos, estoque,
    phibo: item?.chave ?? null,
    phiboDesc: item ? `${item.descricao} / ${item.cor}` : null,
    image: `/produtos/${slug}.jpg`,
    featured: false, active: true, sort: 0,
    _arquivo: f,
  });
}

const cont = {};
for (const p of produtos) cont[p.category] = (cont[p.category] ?? 0) + 1;
console.log(`${produtos.length} produtos a partir das fotos novas`);
console.log("por categoria:", JSON.stringify(cont));
console.log("com preço:", produtos.filter((p) => p.price != null).length);
console.log("com estoque:", produtos.filter((p) => p.estoque).length);
console.log("pares:", produtos.reduce((s, p) => s + Object.values(p.estoque || {}).reduce((a, b) => a + b, 0), 0));

if (avisos.length) {
  console.log(`\navisos (${avisos.length}):`);
  for (const a of avisos) console.log(" -", a);
}

if (!APLICAR) {
  console.log("\nPRÉVIA — rode com --aplicar para gravar.");
  fs.writeFileSync("scripts/novos-produtos.json", JSON.stringify(produtos, null, 2));
  process.exit(0);
}

// --- processa as fotos (mesma regra: nada cortado) ---
for (const p of produtos) {
  const src = path.join(FOTOS, p._arquivo);
  const m = await sharp(src).metadata();
  const emPe = m.height > m.width;
  const top = emPe ? Math.round(m.height * 0.18) : 0;
  const alt = emPe ? Math.round(m.height * 0.64) : m.height;
  const recorte = { left: 0, top, width: m.width, height: alt };

  const fundo = await sharp(src).extract(recorte)
    .resize({ width: L, height: A, fit: "cover" }).blur(28)
    .modulate({ brightness: 1.06, saturation: 0.7 }).toBuffer();
  const frente = await sharp(src).extract(recorte)
    .resize({ width: L, height: A, fit: "inside" })
    .modulate({ brightness: 1.03 }).sharpen({ sigma: 0.6 }).toBuffer();
  const f = await sharp(frente).metadata();

  await sharp(fundo)
    .composite([{ input: frente, left: Math.round((L - f.width) / 2), top: Math.round((A - f.height) / 2) }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(DEST, p.slug + ".jpg"));
  delete p._arquivo;
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let data = null;
for (let t = 1; t <= 4 && !data; t++) {
  ({ data } = await sb.storage.from("bailatto").download("data/products.json"));
  if (!data) await new Promise((r) => setTimeout(r, 1500));
}
if (!data) { console.error("nao consegui baixar a lista"); process.exit(1); }
const atual = JSON.parse(await data.text());

// mantém scarpins, botas, tênis e as rasteiras que não foram refotografadas
const novosSlugs = new Set(produtos.map((p) => p.slug));
const categoriasRefeitas = new Set(produtos.map((p) => p.category));
const mantidos = atual.filter((p) => {
  if (p.category === "scarpins") return true;
  if (!categoriasRefeitas.has(p.category)) return true;   // botas, tênis
  return !novosSlugs.has(p.slug) && p.category === "rasteirinhas"; // rasteiras antigas seguem
});

const final = [...mantidos, ...produtos].map((p, i) => ({ ...p, sort: i }));

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
await sb.storage.from("bailatto").upload(`data/backup-products-${carimbo}.json`, JSON.stringify(atual, null, 2), { contentType: "application/json" });
const { error } = await sb.storage.from("bailatto").upload("data/products.json", JSON.stringify(final, null, 2), { upsert: true, contentType: "application/json" });
if (error) { console.error("upload:", error.message); process.exit(1); }

const cf = {};
for (const p of final) cf[p.category] = (cf[p.category] ?? 0) + 1;
console.log(`\naplicado: ${final.length} produtos no total (backup ${carimbo})`);
console.log("por categoria:", JSON.stringify(cf));
