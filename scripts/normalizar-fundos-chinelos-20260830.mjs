import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGEM =
  "C:/Users/Gustavo/Desktop/Sapatos Bailatto/Calzados Bailatto-20260830T202203Z-1-001/Calzados Bailatto/Chinelos";
const DESTINO = path.resolve("public/produtos");
const LARGURA = 1200;
const ALTURA = 1500;
const FOTOS = [
  ["CBrilhoA.jfif", "chinelo-brilho-amarelo-editorial-20260830.jpg"],
  ["CBrilhoBeige.jfif", "chinelo-brilho-bege-editorial-20260830.jpg"],
  ["CBrilhoC.jfif", "chinelo-brilho-cinza-editorial-20260830.jpg"],
  ["CBrilhoM.jfif", "chinelo-brilho-marrom-editorial-20260830.jpg"],
  ["CSimplesP.jfif", "chinelo-simples-preto-editorial-20260830.jpg"],
];

function suavizar(valor) {
  const t = Math.max(0, Math.min(1, valor));
  return t * t * (3 - 2 * t);
}

async function normalizarFundo(arquivo) {
  const { data, info } = await sharp(arquivo)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luz = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const croma = Math.max(r, g, b) - Math.min(r, g, b);
    const pesoLuz = suavizar((luz - 174) / 58);
    const pesoNeutro = 1 - suavizar((croma - 34) / 78);
    const peso = Math.min(0.96, pesoLuz * pesoNeutro);
    data[i] = Math.round(r + (255 - r) * peso);
    data[i + 1] = Math.round(g + (255 - g) * peso);
    data[i + 2] = Math.round(b + (255 - b) * peso);
  }

  return sharp(data, { raw: info })
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

for (const [entrada, saida] of FOTOS) {
  const fundoNeutralizado = await normalizarFundo(path.join(ORIGEM, entrada));
  const recortada = await sharp(fundoNeutralizado)
    .trim({ background: "#ffffff", threshold: 18 })
    .modulate({ brightness: 1.005, saturation: 0.99 })
    .sharpen({ sigma: 0.5, m1: 0.45, m2: 1.1 })
    .jpeg({ quality: 93, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const frente = await sharp(recortada)
    .resize({ width: 1060, height: 1180, fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer({ resolveWithObject: true });
  const left = Math.round((LARGURA - frente.info.width) / 2);
  const top = Math.max(70, Math.round((ALTURA - frente.info.height) / 2) - 20);
  await sharp({
    create: { width: LARGURA, height: ALTURA, channels: 3, background: "#ffffff" },
  })
    .composite([{ input: frente.data, left, top }])
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(path.join(DESTINO, saida));
}

console.log(`Fundos neutralizados em ${FOTOS.length} fotos de chinelos.`);
