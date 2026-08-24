import fs from "node:fs";
import { products } from "../src/lib/products.ts";

const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  .replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// sinonimos: como a foto/nome do site fala vs como o Phibo fala
const SIN = {
  CHANEL: "MULE", PAPETE: "PAPETE", FLATFORM: "PAPETE", RASTEIRA: "RASTEIRA",
  RASTEIRINHA: "RASTEIRA", TENIS: "TENIS", BOTA: "BOTA", COTURNO: "BOTA",
  MOCASSIM: "MOCASSIM", SCARPIN: "SCARPIN", SANDALIA: "SANDALIA", TAMANCO: "TAMANCO",
  ROSE: "NUDE", ROSA: "ROSA", DOURADO: "DOURADO", CRISTAL: "PRATA",
};
const IGNORAR = new Set(["COM","DE","E","DA","DO","SALTO","BICO","FINO","ALTO","BAIXO","MODELO","TIRAS","TIRA"]);

const raw = fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8").replace(/^\uFEFF/, "");
const linhas = raw.split(/\r?\n/).filter((l) => l.trim());
const cab = linhas[0].split(";");
const ix = Object.fromEntries(cab.map((c, i) => [c.trim(), i]));

const phibo = new Map();
for (const l of linhas.slice(1)) {
  const c = l.split(";");
  const cod = c[ix["Cód. Produto"]]?.trim();
  const cor = c[ix["Cor - Descrição"]]?.trim() || "";
  if (!cod) continue;
  const k = cod + "||" + cor;
  if (!phibo.has(k)) phibo.set(k, {
    cod, cor, desc: c[ix["Descrição Produto"]]?.trim(),
    preco: Number(c[ix["Preço Venda"]]), tamanhos: {}, total: 0,
  });
  const p = phibo.get(k);
  const t = c[ix["Tam - Grade"]]?.trim();
  const q = Number(c[ix["Qtde"]]) || 0;
  p.tamanhos[t] = (p.tamanhos[t] || 0) + q;
  p.total += q;
}

const tokens = (s) => norm(s).split(" ").map(t => SIN[t] || t).filter(t => t.length > 2 && !IGNORAR.has(t));

function pontuar(nossoNome, item) {
  const a = new Set(tokens(nossoNome));
  const b = new Set(tokens(item.desc + " " + item.cor));
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.max(1, Math.min(a.size, b.size));
}

console.log("nossos produtos -> melhores candidatos no Phibo\n");
for (const nosso of products) {
  const ranking = [...phibo.values()]
    .map((it) => ({ it, s: pontuar(nosso.name, it) }))
    .sort((x, y) => y.s - x.s).slice(0, 3);
  const top = ranking[0];
  const marca = top.s >= 0.6 ? "OK " : top.s >= 0.4 ? "?? " : "!! ";
  console.log(`${marca}${nosso.name}  [site R$ ${nosso.price}]`);
  for (const r of ranking) {
    if (r.s <= 0) continue;
    console.log(`      ${(r.s * 100).toFixed(0)}% ${r.it.desc} / ${r.it.cor} — R$ ${r.it.preco} — ${r.it.total} pares`);
  }
}
