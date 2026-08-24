// Gera a planilha de carga em lote do TikTok Shop a partir do nosso catálogo.
// Uma linha por NUMERAÇÃO (é assim que o TikTok trata variação), todas as
// linhas de um produto compartilhando exatamente o mesmo "Nome do produto".
//
//   node scripts/tiktok-planilha.mjs
//
// IMPORTANTE — por que não usar XLSX.writeFile aqui:
// o modelo do TikTok tem DUAS LINHAS OCULTAS no topo da aba Template:
//   linha 1 = chaves técnicas dos campos (category, brand, product_name…)
//   linha 2 = versão do modelo (ex.: V5.0.2)
// O SheetJS não preserva essas linhas ao regravar, e sem elas o TikTok
// responde "Selecione a categoria correspondente a este modelo ou baixe o
// modelo novamente". Por isso mexemos no ZIP e trocamos só o XML da aba,
// deixando todo o resto do arquivo intacto.
import { readFileSync, writeFileSync } from "node:fs";
import { unzipSync, zipSync } from "fflate";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

/** Nossas categorias → categorias exatas do TikTok (da aba "Category" do modelo). */
const CATEGORIA = {
  scarpins: "Sapatos femininos/Sapatos com salto",
  sandalias: "Sapatos femininos/Sandálias e chinelos",
  botas: "Sapatos femininos/Botas",
  rasteirinhas: "Sapatos femininos/Sapatos baixos",
  mocassins: "Sapatos femininos/Sapatilhas sem cadarço",
  tenis: "Sapatos femininos/Tênis",
  mules: "Sapatos femininos/Mules e tamancos",
  tamancos: "Sapatos femininos/Mules e tamancos",
  papete: "Sapatos femininos/Sandálias e chinelos",
  sapatilhas: "Sapatos femininos/Sapatos baixos",
};

// Peso e dimensões de caixa de sapato feminino, confirmados pelo usuário em
// 750 g. O TikTok usa isso para cobrar frete da cliente.
const PESO_G = 750;
const CAIXA = { comprimento: 33, largura: 22, altura: 12 };

/** Onde os dados começam: logo após cabeçalho/obrigatório/descrição. */
const PRIMEIRA_LINHA_DADOS = 6;
// O modelo de "Sapatos femininos" tem 32 colunas (o genérico "Sapatos" tem 28)
// e é o único que traz size_chart — obrigatório para calçado com numeração.
// Ele também aceita as 7 subcategorias que usamos, então dá um upload só.
const COLUNAS = 32;

/** Tabela de numeração publicada — a mesma que aparece no site. */
const TABELA_MEDIDAS =
  "https://tgnxixkmwgifqrksejgg.supabase.co/storage/v1/object/public/bailatto/publico/tabela-numeracao.png";

const produtos = await (
  await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`,
  )
).json();

const linhas = [];
const pulados = [];

for (const p of produtos) {
  const categoria = CATEGORIA[p.category];
  if (!categoria) {
    pulados.push(`${p.slug} — categoria "${p.category}" sem equivalente no TikTok`);
    continue;
  }
  if (p.price == null) {
    pulados.push(`${p.slug} — sem preço`);
    continue;
  }

  const numeracoes = Object.entries(p.estoque ?? {})
    .filter(([, qtd]) => qtd > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  if (numeracoes.length === 0) {
    pulados.push(`${p.slug} — sem estoque em nenhuma numeração`);
    continue;
  }

  for (const [numero, qtd] of numeracoes) {
    const l = new Array(COLUNAS).fill(null);
    l[0] = categoria;
    l[1] = "Bailatto";
    l[2] = p.name;
    l[3] = p.description;
    l[4] = `https://bailatto.com.br${p.image}`;
    l[15] = "Tamanho";
    l[16] = numero;
    l[20] = PESO_G;
    l[21] = CAIXA.comprimento;
    l[22] = CAIXA.largura;
    l[23] = CAIXA.altura;
    l[25] = p.price;
    l[26] = qtd;
    l[27] = `${p.slug}-${numero}`;
    l[31] = TABELA_MEDIDAS; // AF = size_chart
    linhas.push(l);
  }
}

// ---------- montagem do XML ----------
function coluna(i) {
  let s = "";
  i += 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

const escapar = (t) =>
  String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function celula(ref, valor) {
  if (valor === null || valor === "") return "";
  if (typeof valor === "number") return `<c r="${ref}"><v>${valor}</v></c>`;
  // inlineStr evita ter de mexer no sharedStrings.xml compartilhado.
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapar(valor)}</t></is></c>`;
}

const zip = unzipSync(readFileSync(new URL("modelo-fem.xlsx", raiz)));
const CAMINHO_ABA = "xl/worksheets/sheet1.xml";
let xml = Buffer.from(zip[CAMINHO_ABA]).toString("utf8");

// Preserva as linhas 1..5 (2 ocultas + cabeçalho + obrigatório + descrição) e
// descarta da 6 em diante, que são as linhas de exemplo do modelo.
const inicioDados = xml.search(new RegExp(`<row r="${PRIMEIRA_LINHA_DADOS}"`));
const fimSheetData = xml.indexOf("</sheetData>");
if (inicioDados === -1 || fimSheetData === -1) {
  throw new Error("não achei onde começam os dados na aba Template");
}

const xmlLinhas = linhas
  .map((l, i) => {
    const r = PRIMEIRA_LINHA_DADOS + i;
    const cs = l.map((v, c) => celula(`${coluna(c)}${r}`, v)).join("");
    return `<row r="${r}">${cs}</row>`;
  })
  .join("");

xml = xml.slice(0, inicioDados) + xmlLinhas + xml.slice(fimSheetData);

const ultima = PRIMEIRA_LINHA_DADOS + linhas.length - 1;
xml = xml.replace(/<dimension ref="[^"]+"\/>/, `<dimension ref="A1:AB${ultima}"/>`);

zip[CAMINHO_ABA] = new TextEncoder().encode(xml);
writeFileSync(new URL("tiktok-produtos.xlsx", raiz), Buffer.from(zipSync(zip)));

const distintos = new Set(linhas.map((l) => l[2])).size;
console.log(`produtos anunciáveis: ${distintos}`);
console.log(`linhas (SKUs por numeração): ${linhas.length}`);
console.log(`pulados: ${pulados.length}`);
pulados.forEach((s) => console.log("   ·", s));
console.log(`\ngravado: tiktok-produtos.xlsx`);
