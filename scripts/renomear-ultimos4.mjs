import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { lerCsvPhibo, sugerir } from "../src/lib/phibo.ts";

const APLICAR = process.argv.includes("--aplicar");

/**
 * Os 4 produtos que faltavam. O "mule-azul-serenity" na verdade é um TAMANCO —
 * então além do nome ele muda de categoria (a de Tamancos, que estava vazia).
 */
const ALVOS = [
  {
    slugAntigo: "tenis-retro-off-white",
    nome: "Tênis Casual Retro Branco",
    categoria: "tenis",
    familia: /TENIS/i,
    descricao:
      "Tênis casual retrô em branco com solado caramelo — o queridinho que combina com tudo. Conforto e personalidade do dia a dia ao fim de semana.",
  },
  {
    slugAntigo: "mule-azul-serenity",
    nome: "Tamanco Fivela Azul",
    categoria: "tamancos",
    familia: /TAMANCO/i,
    descricao:
      "Tamanco azul com fivela dourada: fácil de calçar, confortável e cheio de charme. O salto bloco dá firmeza para usar o dia inteiro.",
  },
  {
    slugAntigo: "papete-rose-strass-cristal",
    nome: "Papete 3 Tiras Prata",
    categoria: "papete",
    familia: /PAPETE/i,
    descricao:
      "Papete de três tiras com brilho prateado sobre solado macio. Conforto de verdade para o verão, sem abrir mão do glamour.",
  },
  {
    slugAntigo: "papete-rose-strass-dourado",
    nome: "Papete 3 Tiras Nude",
    categoria: "papete",
    familia: /PAPETE/i,
    descricao:
      "Papete de três tiras em nude com brilho delicado. Leve, confortável e combina com qualquer produção de verão.",
  },
];

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const itens = lerCsvPhibo(fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8"));

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let data = null;
for (let t = 1; t <= 4 && !data; t++) {
  ({ data } = await sb.storage.from("bailatto").download("data/products.json"));
  if (!data) await new Promise((r) => setTimeout(r, 1500));
}
if (!data) { console.error("nao consegui baixar a lista"); process.exit(1); }
const lista = JSON.parse(await data.text());

// atribuição global dentro de cada família, para os papetes não brigarem entre si
const disputa = [];
for (let i = 0; i < ALVOS.length; i++) {
  const candidatos = itens.filter((x) => ALVOS[i].familia.test(x.descricao));
  for (const s of sugerir(ALVOS[i].nome, candidatos, 8)) {
    disputa.push({ i, item: s.item, score: s.score });
  }
}
disputa.sort((a, b) => b.score - a.score);
const escolhido = new Map();
const ocupado = new Set();
for (const d of disputa) {
  if (escolhido.has(d.i) || ocupado.has(d.item.chave)) continue;
  escolhido.set(d.i, d.item);
  ocupado.add(d.item.chave);
}

const mudancas = [];
for (let i = 0; i < ALVOS.length; i++) {
  const a = ALVOS[i];
  const item = escolhido.get(i);
  const novoSlug = slugify(a.nome);

  let preco = null;
  let estoque = null;
  let tamanhos = [34, 35, 36, 37, 38, 39];
  if (item) {
    preco = item.preco;
    const e = {};
    for (const [t, q] of Object.entries(item.tamanhos)) if (q > 0) e[t] = q;
    const ts = Object.keys(e).map(Number).sort((x, y) => x - y);
    if (ts.length) { estoque = e; tamanhos = ts; }
  }

  mudancas.push({ ...a, novoSlug, item, preco, estoque, tamanhos });

  const atual = lista.find((p) => p.slug === a.slugAntigo);
  console.log(`${a.slugAntigo}`);
  console.log(`   -> ${a.nome}  [${a.categoria}]`);
  console.log(`   ${item ? `${item.descricao} / ${item.cor}` : "SEM CORRESPONDENTE"}`);
  console.log(`   preço R$ ${atual?.price ?? "—"} -> R$ ${preco}   estoque: ${estoque ? Object.entries(estoque).map(([t, q]) => t + ":" + q).join(" ") : "—"}\n`);
}

if (!APLICAR) {
  console.log("PRÉVIA — rode com --aplicar para gravar.");
  process.exit(0);
}

for (const m of mudancas) {
  const de = path.join("public/produtos", m.slugAntigo + ".jpg");
  const para = path.join("public/produtos", m.novoSlug + ".jpg");
  if (fs.existsSync(de) && de !== para) fs.renameSync(de, para);

  const i = lista.findIndex((p) => p.slug === m.slugAntigo);
  if (i < 0) continue;
  lista[i] = {
    ...lista[i],
    name: m.nome,
    slug: m.novoSlug,
    category: m.categoria,
    image: `/produtos/${m.novoSlug}.jpg`,
    description: m.descricao,
    price: m.preco,
    estoque: m.estoque,
    sizes: m.tamanhos,
    phibo: m.item?.chave ?? null,
    phiboDesc: m.item ? `${m.item.descricao} / ${m.item.cor}` : null,
  };
}

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
await sb.storage.from("bailatto").upload(`data/backup-products-${carimbo}.json`, JSON.stringify(lista, null, 2), { contentType: "application/json" });
const { error } = await sb.storage.from("bailatto").upload("data/products.json", JSON.stringify(lista, null, 2), { upsert: true, contentType: "application/json" });
if (error) { console.error("upload:", error.message); process.exit(1); }

const cont = {};
for (const p of lista) cont[p.category] = (cont[p.category] ?? 0) + 1;
console.log(`aplicado (backup ${carimbo})`);
console.log("por categoria:", cont);
