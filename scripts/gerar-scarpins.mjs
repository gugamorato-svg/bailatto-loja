import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { lerCsvPhibo, sugerir } from "../src/lib/phibo.ts";

const DIR = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";
const DEST = "public/produtos";
const itens = lerCsvPhibo(fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8"));

const titulo = (s) =>
  s
    .split(" ")
    .map((p) => (p.length <= 2 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase()))
    .join(" ");

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function descrever(nome, cor) {
  const n = nome.toLowerCase();
  const c = (cor || "").toLowerCase();
  if (n.includes("encomenda"))
    return "Modelo exclusivo, feito sob encomenda especialmente para você. Fale com a gente no WhatsApp para combinar numeração, cor e prazo de produção.";
  if (n.includes("slingback"))
    return `Slingback em ${c}: a tira atrás valoriza o pé e deixa o passo mais leve. Bico fino que alonga a silhueta — do escritório ao jantar, sempre elegante.`;
  if (n.includes("glitter"))
    return `Brilho na medida certa: o glitter ${c} transforma este scarpin na estrela da noite. Perfeito para festas, formaturas e comemorações.`;
  if (n.includes("sola vermelha") || n.includes("sola de onça"))
    return `A sola marcante assina cada passo. Acabamento impecável em ${c} para quem quer um look poderoso e cheio de personalidade.`;
  if (n.includes("bloco fivela"))
    return `Salto bloco com fivela dourada em ${c}: estabilidade para o dia todo com um toque de sofisticação. Conforto que combina com tudo.`;
  if (n.includes("bloco"))
    return `Salto bloco em ${c} — o equilíbrio perfeito entre altura e conforto. Ideal para quem passa horas em pé sem abrir mão do estilo.`;
  if (n.includes("verniz"))
    return `O brilho do verniz em ${c} ilumina a produção. Um clássico atemporal que eleva qualquer look, do trabalho à ocasião especial.`;
  if (n.includes("jeans"))
    return "O charme descontraído do jeans num scarpin elegante. Combina com vestido, alfaiataria e aquele look despojado de fim de semana.";
  return `Scarpin em ${c} com acabamento macio e bico fino que alonga as pernas. Um coringa elegante para o dia a dia e para os momentos especiais.`;
}

const fotos = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const semSufixo = (f) => path.parse(f).name.replace(/\s*\(\d+\)$/, "");
const ehEncomenda = (f) => /encomenda/i.test(semSufixo(f));

const produtos = [];
const avisos = [];

// Só faz sentido comparar scarpin com scarpin. Sem esse filtro, uma foto que
// sobra acaba casando com "NÉCESSAIRE" por coincidência de cor.
const itemEncomenda = itens.find((i) => /ENCOMENDA/i.test(i.descricao));
const scarpins = itens.filter((i) => /SCARPIN/i.test(i.descricao));

const listaDe = new Map();
for (const foto of fotos) {
  if (!ehEncomenda(foto)) listaDe.set(foto, sugerir(semSufixo(foto), scarpins, 10));
}

// 1ª passada: atribuição global — o melhor par vence e o item sai da disputa.
// Isso separa corretamente variações como "verniz azul", "azul baby" e "azul escuro".
const candidatos = [];
for (const [foto, lista] of listaDe) {
  for (const s of lista) candidatos.push({ foto, item: s.item, score: s.score });
}
candidatos.sort((a, b) => b.score - a.score);

const escolhido = new Map();
const itemOcupado = new Set();
for (const c of candidatos) {
  if (escolhido.has(c.foto) || itemOcupado.has(c.item.chave)) continue;
  if (c.score < 0.6) continue; // não vale forçar um par ruim só para preencher
  escolhido.set(c.foto, c.item);
  itemOcupado.add(c.item.chave);
}

// 2ª passada: fotos que sobraram usam o melhor candidato delas mesmo que o item
// já tenha dono — é o caso de duas fotos do mesmo código (ex.: "marrom" e
// "marrom claro"), que realmente dividem o estoque.
for (const [foto, lista] of listaDe) {
  if (escolhido.has(foto) || !lista[0]) continue;
  escolhido.set(foto, lista[0].item);
  avisos.push(
    `"${path.parse(foto).name}" divide o estoque de ${lista[0].item.descricao} / ${lista[0].item.cor}`,
  );
}

for (const foto of fotos) {
  const cru = path.parse(foto).name;
  const encomenda = ehEncomenda(foto);
  const item = encomenda ? itemEncomenda : escolhido.get(foto);
  if (!item) {
    avisos.push(`sem item do Phibo: ${cru}`);
    continue;
  }

  const nome = titulo(cru);
  const slug = slugify(cru);

  const meta = await sharp(path.join(DIR, foto)).metadata();
  const alvo = 3 / 2;
  let w = meta.width;
  let h = Math.round(meta.width / alvo);
  if (h > meta.height) {
    h = meta.height;
    w = Math.round(meta.height * alvo);
  }
  await sharp(path.join(DIR, foto))
    .extract({
      left: Math.round((meta.width - w) / 2),
      top: Math.round((meta.height - h) / 2),
      width: w,
      height: h,
    })
    .resize({ width: 1200, kernel: "lanczos3" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(DEST, slug + ".jpg"));

  // A cor precisa bater: herdar o estoque de um sapato de outra cor faria a loja
  // prometer numeração que não existe.
  const CORES = ["branco", "rosa", "marrom", "verde", "preto", "dourado", "prata",
    "nude", "azul", "vermelho", "caramelo", "cinza", "vinho", "bege", "amarelo",
    "laranja", "roxo", "cobre"];
  const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const corFoto = CORES.find((c) => semAcento(cru).includes(c));
  const corItem = semAcento(item.cor || "");
  const corConfere = !corFoto || !corItem || corFoto === corItem;

  const estoque = {};
  if (corConfere) {
    for (const [t, q] of Object.entries(item.tamanhos)) if (q > 0) estoque[t] = q;
  } else {
    avisos.push(
      `"${cru}": cor não confere com ${item.descricao} / ${item.cor} — mantive o preço e deixei o estoque em aberto`,
    );
  }
  const tamanhos = Object.keys(estoque).map(Number).sort((a, b) => a - b);

  produtos.push({
    id: crypto.randomUUID(),
    slug,
    name: nome,
    category: "scarpins",
    description: descrever(cru, item.cor),
    price: encomenda ? 249.9 : item.preco,
    promoPrice: null,
    sizes: encomenda || !tamanhos.length ? [34, 35, 36, 37, 38, 39] : tamanhos,
    estoque: encomenda || !tamanhos.length ? null : estoque,
    phibo: item.chave,
    phiboDesc: `${item.descricao} / ${item.cor}`,
    image: `/produtos/${slug}.jpg`,
    featured: false,
    active: true,
    sort: 0,
  });
}

// Destaques: os modelos com mais estoque aparecem na home
const porEstoque = [...produtos]
  .filter((p) => p.estoque)
  .sort((a, b) => {
    const s = (x) => Object.values(x.estoque).reduce((t, n) => t + n, 0);
    return s(b) - s(a);
  });
for (const p of porEstoque.slice(0, 4)) p.featured = true;

fs.writeFileSync("scripts/novos-scarpins.json", JSON.stringify(produtos, null, 2));

console.log(`gerados: ${produtos.length} scarpins`);
const faixas = {};
for (const p of produtos) faixas[p.price] = (faixas[p.price] || 0) + 1;
console.log("precos:", Object.entries(faixas).sort().map(([p, n]) => `R$ ${p} (${n})`).join(" · "));
console.log("pares em estoque:", produtos.reduce((s, p) => s + Object.values(p.estoque || {}).reduce((a, b) => a + b, 0), 0));
console.log("itens do Phibo usados:", itemOcupado.size, "de", itens.length);
console.log("destaques:", porEstoque.slice(0, 4).map((p) => p.name).join(" · "));
if (avisos.length) {
  console.log("\navisos:");
  for (const a of avisos) console.log(" -", a);
}
