import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [origem, destino] = process.argv.slice(2);
if (!origem || !destino) {
  throw new Error("Uso: node scripts/preparar-saida-galeria.mjs <origem> <destino>");
}
if (!fs.existsSync(origem)) throw new Error(`Imagem gerada não encontrada: ${origem}`);

fs.mkdirSync(path.dirname(destino), { recursive: true });
await sharp(origem)
  .rotate()
  .flatten({ background: "#ffffff" })
  .resize({ width: 1200, height: 1500, fit: "contain", background: "#ffffff" })
  .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(destino);

console.log(destino);

