import sharp from "sharp";

const SRC = "C:/Users/Gustavo/Downloads/loja/loja.webp";
const OUT = "C:/Users/Gustavo/bailatto-loja/public/loja.jpg";

// >>> Ajustes finos (mexer aqui se precisar) <<<
const ANGLE = -1.3; // graus. negativo = gira anti-horário (levanta o lado direito)
const cropTop = 0.1; // remove teto de fora (topo)
const cropBottom = 0.17; // remove piso de fora (base)
const cropLeft = 0.04;
const cropRight = 0.04;

const rot = await sharp(SRC)
  .rotate(ANGLE, { background: { r: 20, g: 14, b: 12 } })
  .toBuffer({ resolveWithObject: true });

const W = rot.info.width;
const H = rot.info.height;
const left = Math.round(W * cropLeft);
const top = Math.round(H * cropTop);
const width = Math.round(W * (1 - cropLeft - cropRight));
const height = Math.round(H * (1 - cropTop - cropBottom));

await sharp(rot.data)
  .extract({ left, top, width, height })
  .resize({ width: 1500, kernel: "lanczos3" })
  .modulate({ brightness: 1.12, saturation: 1.14 })
  .sharpen({ sigma: 1.1 })
  .jpeg({ quality: 89, mozjpeg: true })
  .toFile(OUT);

const m = await sharp(OUT).metadata();
console.log(`loja.jpg ${m.width}x${m.height}  aspect ${(m.width / m.height).toFixed(3)}`);
