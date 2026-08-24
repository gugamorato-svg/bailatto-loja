// Casa as fotos novas (Desktop) com o estoque do Phibo e monta uma TABELA DE
// CONFERÊNCIA — não publica nada. Só depois de o usuário aprovar é que
// aplico-novos.mjs grava no site.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CSV = "C:/Users/Gustavo/Downloads/estoque.csv";
const PASTA = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(\d+\)/g, "")
    .replace(/lezzar/g, "lezar")   // foto escreve com zz, Phibo com um z s\u00f3
    .replace(/[^a-z0-9]+/g, " ").trim();

// "bloco" saiu da lista: distingue SAND\u00c1LIA BLOCO LEZAR de outras sand\u00e1lias.
const GENERICAS = new Set(["de", "com", "e", "a", "o", "salto", "feminino", "feminina"]);
const palavras = (s) => norm(s).split(" ").filter((t) => t && !GENERICAS.has(t));

// --- 1. agrupa o Phibo por (código, cor) ---
const linhas = readFileSync(CSV, "utf8").replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.trim());
const cab = linhas[0].split(";").map((c) => c.trim());
const col = (n) => cab.indexOf(n);
const [iCod, iDesc, iPreco, iTam, iQtd, iCor] =
  ["Cód. Produto", "Descrição Produto", "Preço Venda", "Tam - Grade", "Qtde", "Cor - Descrição"].map(col);

const grupos = new Map();
for (const l of linhas.slice(1)) {
  const c = l.split(";");
  const cod = c[iCod]?.trim();
  if (!cod) continue;
  const cor = c[iCor]?.trim() ?? "";
  const chave = `${cod}||${cor}`;
  if (!grupos.has(chave)) {
    grupos.set(chave, {
      chave, cod, cor,
      descricao: c[iDesc]?.trim() ?? cod,
      preco: Number(String(c[iPreco] ?? "").replace(",", ".")) || 0,
      estoque: {},
    });
  }
  const g = grupos.get(chave);
  const tam = c[iTam]?.trim();
  const qtd = Number(c[iQtd]) || 0;
  if (tam && /^\d+$/.test(tam)) g.estoque[tam] = (g.estoque[tam] ?? 0) + qtd;
}
const todosGrupos = [...grupos.values()];

// --- 2. score de casamento: foto vs (descrição + cor) do Phibo ---
function pontuar(foto, g) {
  const alvo = new Set(palavras(`${g.descricao} ${g.cor}`));
  const nossas = new Set(palavras(foto));
  let iguais = 0;
  for (const p of nossas) if (alvo.has(p)) iguais++;
  const base = (2 * iguais) / (nossas.size + alvo.size);
  // cor tem de bater: sem a cor certa, não é o mesmo produto
  const corBate = palavras(foto).some((p) => norm(g.cor).split(" ").includes(p));
  return base * (corBate ? 1.2 : 0.5);
}

const fotos = readFileSync(new URL("../_novos.txt", import.meta.url), "utf8")
  .split("\n").filter(Boolean);

const resultado = [];
for (const foto of fotos) {
  const ranked = todosGrupos
    .filter((g) => Object.values(g.estoque).some((n) => n > 0)) // só com estoque
    .map((g) => ({ g, s: pontuar(foto, g) }))
    .sort((a, b) => b.s - a.s);
  const melhor = ranked[0];
  resultado.push({ foto, melhor, segundo: ranked[1] });
}

// --- 3. tabela de conferência ---
console.log("FOTO".padEnd(34), "SCORE", "PREÇO".padEnd(8), "NUMS", "→ CASOU COM (Phibo)");
console.log("-".repeat(110));
for (const r of resultado) {
  const g = r.melhor?.g;
  const nums = g ? Object.keys(g.estoque).filter((n) => g.estoque[n] > 0).sort((a, b) => a - b).join(",") : "—";
  const flag = (r.melhor?.s ?? 0) < 0.45 ? " ⚠" : (r.melhor?.s - (r.segundo?.s ?? 0) < 0.1 ? " ~" : "");
  console.log(
    r.foto.padEnd(34),
    (r.melhor?.s ?? 0).toFixed(2),
    ("R$" + (g?.preco ?? 0)).padEnd(8),
    nums.padEnd(14),
    "→", `${g?.descricao} / ${g?.cor}`.slice(0, 40) + flag,
  );
}
console.log("\n⚠ = casamento fraco (score<0.45)   ~ = 1º e 2º muito próximos (ambíguo)");

writeFileSync(
  new URL("../_casamento-novos.json", import.meta.url),
  JSON.stringify(resultado.map((r) => ({
    foto: r.foto,
    score: r.melhor?.s,
    phibo: r.melhor?.g.chave,
    descricao: r.melhor?.g.descricao,
    cor: r.melhor?.g.cor,
    preco: r.melhor?.g.preco,
    estoque: r.melhor?.g.estoque,
  })), null, 1),
);
