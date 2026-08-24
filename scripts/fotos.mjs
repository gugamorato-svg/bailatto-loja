import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const SRC = "C:/Users/Gustavo/Downloads/loja";
const PUB = "C:/Users/Gustavo/bailatto-loja/public";
const GAL = path.join(PUB, "loja");
fs.mkdirSync(GAL, { recursive: true });

async function melhora(input, output, { width, brightness = 1.08 } = {}) {
  await sharp(input)
    .rotate()
    .resize({ width, kernel: "lanczos3" })
    .modulate({ brightness, saturation: 1.14 })
    .sharpen({ sigma: 1.1 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(output);
  const m = await sharp(output).metadata();
  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`OK ${path.basename(output)}  ${m.width}x${m.height}  ${kb}KB`);
}

// Fachada (foto principal da seção "Visite a loja") — clareia um pouco (foto noturna)
await melhora(path.join(SRC, "loja.webp"), path.join(PUB, "loja.jpg"), {
  width: 1400,
  brightness: 1.12,
});
// Interior
await melhora(path.join(SRC, "unnamed.webp"), path.join(GAL, "interior.jpg"), {
  width: 1400,
  brightness: 1.06,
});
// Detalhe dos sapatos (vitrine)
await melhora(path.join(SRC, "loja 2.webp"), path.join(GAL, "detalhe.jpg"), {
  width: 1000,
  brightness: 1.05,
});
console.log("pronto");
