import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const NOVAS =
  "C:/Users/Gustavo/Desktop/Sapatos Bailatto/Calzados Bailatto-20260830T202203Z-1-001/Calzados Bailatto";
const SAIDA = path.resolve("_auditoria-fotos-20260830");
const PRODUTOS_URL =
  "https://tgnxixkmwgifqrksejgg.supabase.co/storage/v1/object/public/bailatto/data/products.json";
const CATEGORIAS = new Set([
  "botas",
  "chinelos",
  "mocassins",
  "rasteirinhas",
  "scarpins",
  "tamancos",
]);

fs.mkdirSync(SAIDA, { recursive: true });

function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function quebrar(texto, limite = 34) {
  const palavras = String(texto).split(/\s+/);
  const linhas = [];
  let linha = "";
  for (const palavra of palavras) {
    const proxima = linha ? `${linha} ${palavra}` : palavra;
    if (proxima.length > limite && linha) {
      linhas.push(linha);
      linha = palavra;
    } else {
      linha = proxima;
    }
  }
  if (linha) linhas.push(linha);
  return linhas.slice(0, 3);
}

async function cartao(item, indice, largura = 420, altura = 520) {
  const areaImagem = 410;
  const imagem = await sharp(item.arquivo)
    .rotate()
    .resize({
      width: largura - 28,
      height: areaImagem - 28,
      fit: "contain",
      background: "#f4f0ea",
      withoutEnlargement: false,
    })
    .flatten({ background: "#f4f0ea" })
    .jpeg({ quality: 86 })
    .toBuffer();

  const linhas = quebrar(item.nome);
  const textos = linhas
    .map(
      (linha, i) =>
        `<text x="22" y="${452 + i * 24}" font-family="Arial" font-size="18" fill="#1a1613">${escapar(linha)}</text>`,
    )
    .join("");
  const legenda = Buffer.from(`
    <svg width="${largura}" height="${altura}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fbfaf8"/>
      <rect x="0" y="0" width="${largura}" height="${areaImagem}" fill="#f4f0ea"/>
      <text x="18" y="32" font-family="Arial" font-size="21" font-weight="700" fill="#6e2438">${indice}</text>
      <text x="22" y="430" font-family="Arial" font-size="15" fill="#6e2438">${escapar(item.grupo)}</text>
      ${textos}
    </svg>`);

  return sharp(legenda)
    .composite([{ input: imagem, gravity: "north", top: 14, left: 14 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function prancha(itens, nome, colunas = 4) {
  const largura = 420;
  const altura = 520;
  const linhas = Math.ceil(itens.length / colunas);
  const fundo = sharp({
    create: {
      width: largura * colunas,
      height: altura * linhas,
      channels: 3,
      background: "#fbfaf8",
    },
  });
  const cards = await Promise.all(itens.map((item, i) => cartao(item, i + 1, largura, altura)));
  await fundo
    .composite(
      cards.map((input, i) => ({
        input,
        left: (i % colunas) * largura,
        top: Math.floor(i / colunas) * altura,
      })),
    )
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(SAIDA, nome));
}

function listarNovas(diretorio) {
  const resultado = [];
  for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const completo = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) resultado.push(...listarNovas(completo));
    else if (/\.(?:jpe?g|jfif|png|webp)$/i.test(entrada.name)) {
      resultado.push({
        arquivo: completo,
        grupo: path.basename(path.dirname(completo)),
        nome: entrada.name,
      });
    }
  }
  return resultado.sort((a, b) => `${a.grupo}/${a.nome}`.localeCompare(`${b.grupo}/${b.nome}`, "pt-BR"));
}

const novas = listarNovas(NOVAS);
await prancha(novas, "01-fotos-novas.jpg", 4);

const resposta = await fetch(`${PRODUTOS_URL}?t=${Date.now()}`);
if (!resposta.ok) throw new Error(`Falha ao baixar catálogo: HTTP ${resposta.status}`);
const produtos = await resposta.json();
const atuais = produtos
  .filter((p) => CATEGORIAS.has(p.category) && p.image)
  .map((p) => ({
    arquivo: path.resolve("public", p.image.replace(/^\//, "")),
    grupo: p.category,
    nome: p.name,
    slug: p.slug,
  }))
  .filter((p) => fs.existsSync(p.arquivo))
  .sort((a, b) => `${a.grupo}/${a.nome}`.localeCompare(`${b.grupo}/${b.nome}`, "pt-BR"));

for (const categoria of [...CATEGORIAS]) {
  const itens = atuais.filter((p) => p.grupo === categoria);
  if (itens.length) await prancha(itens, `atual-${categoria}.jpg`, 4);
}

fs.writeFileSync(
  path.join(SAIDA, "novas.json"),
  JSON.stringify(novas.map((x, i) => ({ numero: i + 1, ...x })), null, 2),
);
fs.writeFileSync(path.join(SAIDA, "atuais.json"), JSON.stringify(atuais, null, 2));
console.log(`Pranchas criadas em ${SAIDA}: ${novas.length} fotos novas, ${atuais.length} produtos atuais relevantes.`);
