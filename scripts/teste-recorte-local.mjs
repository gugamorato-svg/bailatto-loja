import { removeBackground } from "@imgly/background-removal-node";
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const url = "https://bailatto.com.br/produtos/scarpin-slingback-azul.jpg";
console.log("baixando modelo (só na primeira vez) e recortando…");
const t0 = Date.now();
const blob = await removeBackground(url);
const buf = Buffer.from(await blob.arrayBuffer());
writeFileSync("teste-claid/local-recorte.png", buf);
const m = await sharp(buf).metadata();
console.log(`pronto em ${((Date.now()-t0)/1000).toFixed(1)}s`);
console.log(`canais: ${m.channels} | alpha: ${m.hasAlpha} | ${m.width}x${m.height}`);
