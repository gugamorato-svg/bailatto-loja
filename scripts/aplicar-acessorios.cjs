// Publica as semijoias e acessorios novos (fotos da pasta do Desktop, precos e
// estoque vindos do estoque.csv do Phibo). Sao produtos de TAMANHO UNICO:
// sizes vazio e estoque na chave "U".
//
//   node scripts/aplicar-acessorios.cjs --dry   -> mostra sem gravar
//   node scripts/aplicar-acessorios.cjs         -> grava fotos + products.json
const fs = require("fs");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

const DRY = process.argv.includes("--dry");
const PASTA = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";
const L = 1024, A = 1280;
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const slug = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// Brincos dourados: 23 desenhos distintos, um par de cada.
const DOURADOS = ["Estrela", "Pétalas", "Cauda de Sereia", "Estrela-do-Mar Vazada",
  "Margaridas", "Flor de Lírio", "Botão Plissado", "Argola Oval Torcida",
  "Botão Texturizado", "Estrela-do-Mar", "Coração Trançado", "Flor Cinco Pétalas",
  "Coração Vazado", "Pétala Martelada", "Coração Canelado", "Argola Martelada",
  "Concha", "Argola Drapeada", "Disco Plissado", "Coração Pequeno", "Gota Lisa",
  "Borboleta", "Folha Drapeada"];

// Brincos prata, linha marinha. Fotos repetidas do mesmo desenho viram estoque,
// nao anuncio duplicado: [nome, numeros das fotos].
const PRATAS = [["Estrela-do-Mar Texturizada", [1, 12]], ["Botão Pontilhado", [2, 11]],
  ["Peixe", [3]], ["Peixe Escamas", [4, 19]], ["Caranguejo", [5]],
  ["Estrela-do-Mar Grande", [6]], ["Concha Canelada", [7, 10]], ["Concha Leque", [8]],
  ["Espinha de Peixe", [9]], ["Flor Rendada", [13]], ["Concha Vieira", [14]],
  ["Camarão", [15]], ["Argola Orgânica", [16]], ["Cauda de Sereia", [17]], ["Búzio", [18]]];

const CONJUNTOS = ["Cristal Champagne", "Coração Pink", "Gota Esmeralda", "Gota Rosé",
  "Coração Preto", "Coração Azul", "Gota Cristal"];

const TORNOZELEIRAS = ["Berloques", "Estrela"];

// So as estampas proprias. As de monograma de grife ficaram de fora do lote.
const LENCOS = [[1, "Geométrico"], [2, "Floral"], [3, "Barroco Dourado"],
  [6, "Floral Dourado"], [9, "Paisley"]];

const itens = [];
const dois = (n) => String(n).padStart(2, "0");

DOURADOS.forEach((desenho, i) => itens.push({
  foto: `Brinco folheado dourado (${dois(i + 1)}).jpg`,
  name: `Brinco Dourado ${desenho}`, cat: "semijoias", preco: 15, qtd: 1, joia: true,
  desc: `Brinco folheado dourado no formato de ${desenho.toLowerCase()}. Peça única: temos só este par na loja.`,
  phibo: "BRINCO 01||Dourado", phiboDesc: "BRINCO FOLHEADO / Dourado",
}));

PRATAS.forEach(([nome, fotos]) => itens.push({
  foto: `Brinco folheado prata (${dois(fotos[0])}).jpg`,
  name: `Brinco Prata ${nome}`, cat: "semijoias", preco: 15, qtd: fotos.length, joia: true,
  desc: `Brinco folheado prateado no formato de ${nome.toLowerCase()}, da linha marinha.`,
  phibo: "BRINCO 01||Prata", phiboDesc: "BRINCO FOLHEADO / Prata",
}));

CONJUNTOS.forEach((pedra, i) => itens.push({
  foto: `Conjunto folheado (${dois(i + 1)}).jpg`,
  name: `Conjunto Folheado ${pedra}`, cat: "semijoias", preco: 25, qtd: 1, joia: true,
  desc: `Conjunto folheado com colar e brincos em ${pedra.toLowerCase()}. Vem na cartela, pronto para presentear.`,
  phibo: "1955105235||Multicor", phiboDesc: "CONJUNTO FOLHEADO / Multicor",
}));

TORNOZELEIRAS.forEach((detalhe, i) => itens.push({
  foto: `Tornozeleira folheada dourada (${dois(i + 1)}).jpg`,
  name: `Tornozeleira Dourada ${detalhe}`, cat: "semijoias", preco: 15, qtd: 1, joia: true,
  desc: `Tornozeleira folheada dourada com ${detalhe.toLowerCase()}. Fecho com corrente de ajuste.`,
  phibo: "TORNO 01||Dourado", phiboDesc: "TORNOZELEIRA FOLHEADA / Dourado",
}));

LENCOS.forEach(([n, estampa]) => itens.push({
  foto: `Lenços (${dois(n)}).jpg`,
  name: `Lenço ${estampa}`, cat: "acessorios", preco: 39.9, qtd: 1, joia: false,
  desc: `Lenço em cetim com estampa ${estampa.toLowerCase()}. Use no pescoço, na alça da bolsa ou no cabelo.`,
  phibo: "LEN 01||Multicor", phiboDesc: "LENÇO / Multicor",
}));

const VOLUMOSOS = [
  ["Bolsa baguete branca.jpg", "Bolsa Baguete Branca", 39.9, 1,
    "Bolsa baguete branca com alça de ombro e corrente dourada. Formato clássico que vai do dia à noite.",
    "BOLS BA 01||Branco", "BOLSA BAGUETE / Branco"],
  ["Kit bolsa.jpg", "Kit Bolsa Off-White e Caramelo", 119.9, 1,
    "Kit com bolsa tote off-white e bolsa menor caramelo com corrente. Duas peças que se completam.",
    "KIT BOL 01||Multicor", "KIT BOLSA / Multicor"],
  ["Carteira simples marrom.jpg", "Carteira Envelope Marrom", 19.9, 2,
    "Carteira compacta modelo envelope em marrom. Cabe cartões, cédulas e o essencial do dia.",
    "CART 01||Caramelo", "CARTEIRA SIMPLES / Caramelo"],
  ["Carteira simples nude.jpg", "Carteira Envelope Nude", 19.9, 5,
    "Carteira compacta modelo envelope em nude. Cabe cartões, cédulas e o essencial do dia.",
    "CART 01||Nude", "CARTEIRA SIMPLES / Nude"],
  ["Carteira simples preto.jpg", "Carteira Envelope Preta", 19.9, 5,
    "Carteira compacta modelo envelope em preto. Cabe cartões, cédulas e o essencial do dia.",
    "CART 01||Preto", "CARTEIRA SIMPLES / Preto"],
  ["Nécessaire branca.jpg", "Nécessaire Branca", 39.9, 1,
    "Nécessaire branca de abertura ampla, com alça. Organiza maquiagem e itens de banho na viagem.",
    "NECE 01||Branco", "NÉCESSAIRE / Branco"],
  ["Nécessaire marrom.jpg", "Nécessaire Marrom", 39.9, 2,
    "Nécessaire marrom de abertura ampla, com alça. Organiza maquiagem e itens de banho na viagem.",
    "NECE 01||Marrom", "NÉCESSAIRE / Marrom"],
  ["Nécessaire preto.jpg", "Nécessaire Preta", 39.9, 2,
    "Nécessaire preta de abertura ampla, com alça. Organiza maquiagem e itens de banho na viagem.",
    "NECE 01||Preto", "NÉCESSAIRE / Preto"],
];
VOLUMOSOS.forEach(([foto, name, preco, qtd, desc, phibo, phiboDesc]) => itens.push({
  foto, name, cat: "acessorios", preco, qtd, joia: false, desc, phibo, phiboDesc,
}));

/**
 * Joia: corte fechado (a peca ocupa so o cartao no centro da foto).
 * Volumoso (bolsa, necessaire, lenco): largura inteira, senao corta a alca.
 */
async function processar(origem, joia) {
  const m = await sharp(origem).metadata();
  let rec;
  if (joia) {
    const w = Math.round(m.width * 0.78);
    const h = Math.min(m.height, Math.round(w * 5 / 4));
    rec = { left: Math.round((m.width - w) / 2), top: Math.max(0, Math.round(m.height / 2 - h / 2)), width: w, height: h };
  } else {
    const h = Math.min(m.height, Math.round(m.width * 5 / 4));
    rec = { left: 0, top: Math.max(0, Math.round((m.height - h) / 2)), width: m.width, height: h };
  }
  return sharp(origem).extract(rec).resize(L, A, { fit: "cover" })
    .sharpen({ sigma: 0.5 }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}

(async () => {
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: dl, error: e1 } = await sb.storage.from("bailatto").download("data/products.json");
  if (e1) throw e1;
  const catalogo = JSON.parse(await dl.text());
  const existentes = new Set(catalogo.map((p) => p.slug));
  let maxSort = Math.max(...catalogo.map((p) => p.sort ?? 0));
  console.log(`catálogo atual: ${catalogo.length} produtos\n`);

  const novos = [];
  for (const it of itens) {
    const s = slug(it.name);
    if (existentes.has(s)) { console.log(`  · pula (já existe): ${s}`); continue; }
    const origem = `${PASTA}/${it.foto}`;
    if (!fs.existsSync(origem)) { console.error(`  ✗ foto sumida: ${it.foto}`); continue; }
    const buf = await processar(origem, it.joia);
    if (!DRY) {
      fs.writeFileSync(`public/produtos/${s}.jpg`, buf);
      const { error } = await sb.storage.from("bailatto")
        .upload(`produtos/${s}.jpg`, buf, { contentType: "image/jpeg", upsert: true });
      if (error) { console.error(`    ✗ upload: ${error.message}`); continue; }
    }
    novos.push({
      id: crypto.randomUUID(), slug: s, name: it.name, category: it.cat,
      description: it.desc, price: it.preco, promoPrice: null,
      sizes: [], estoque: { U: it.qtd }, tamanhoUnico: true,
      phibo: it.phibo, phiboDesc: it.phiboDesc,
      image: `/produtos/${s}.jpg`, featured: false, active: true, sort: ++maxSort,
    });
    console.log(`  + ${s}  R$${it.preco}  est.${it.qtd}  ${(buf.length / 1024) | 0}KB`);
  }

  console.log(`\nnovos: ${novos.length}`);
  if (DRY) { console.log("--dry: nada gravado"); return; }
  const atualizado = [...catalogo, ...novos];
  const { error: e2 } = await sb.storage.from("bailatto").upload("data/products.json",
    JSON.stringify(atualizado, null, 2), { contentType: "application/json", upsert: true });
  if (e2) throw e2;
  console.log(`✓ products.json: ${atualizado.length} produtos no total`);
})();
