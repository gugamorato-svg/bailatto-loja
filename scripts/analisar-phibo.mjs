import fs from "node:fs";

const raw = fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8").replace(/^\uFEFF/, "");
const linhas = raw.split(/\r?\n/).filter(l => l.trim());
const cab = linhas[0].split(";");
const idx = Object.fromEntries(cab.map((c, i) => [c.trim(), i]));

const produtos = new Map();
for (const linha of linhas.slice(1)) {
  const c = linha.split(";");
  const cod = c[idx["Cód. Produto"]]?.trim();
  const cor = c[idx["Cor - Descrição"]]?.trim() || "";
  if (!cod) continue;
  const chave = cod + " | " + cor;
  if (!produtos.has(chave)) {
    produtos.set(chave, {
      cod, cor,
      descricao: c[idx["Descrição Produto"]]?.trim(),
      preco: Number(c[idx["Preço Venda"]]),
      categoria: c[idx["Categoria"]]?.trim(),
      tamanhos: {},
      total: 0,
    });
  }
  const p = produtos.get(chave);
  const tam = c[idx["Tam - Grade"]]?.trim();
  const qtd = Number(c[idx["Qtde"]]) || 0;
  p.tamanhos[tam] = (p.tamanhos[tam] || 0) + qtd;
  p.total += qtd;
}

console.log("produtos distintos (codigo+cor):", produtos.size);
const precos = [...produtos.values()].map(p => p.preco).filter(Number.isFinite);
console.log("faixa de preco: R$", Math.min(...precos), "a R$", Math.max(...precos));
console.log("pares em estoque:", [...produtos.values()].reduce((s, p) => s + p.total, 0));

console.log("\n=== por descricao (modelo) ===");
const porDesc = new Map();
for (const p of produtos.values()) {
  if (!porDesc.has(p.descricao)) porDesc.set(p.descricao, { cores: [], preco: p.preco, total: 0 });
  const d = porDesc.get(p.descricao);
  d.cores.push(p.cor);
  d.total += p.total;
}
for (const [desc, d] of [...porDesc].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${desc} — R$ ${d.preco} — ${d.total} pares — cores: ${d.cores.join(", ")}`);
}
