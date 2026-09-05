import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repo = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(repo, "output", "imagegen", "galerias-bailatto-20260903");
const generatedDir = "C:/Users/Gustavo/.codex/generated_images/01a048db-8791-7341-b749-88376afce1c3";
const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manifest.json"), "utf8"));

const rawNames = [
  "exec-9d2fb603-7587-4aea-a199-04c9e0090c09.png",
  "exec-9101bf83-bac5-43e0-b99d-163a229c9341.png",
  "exec-70a68bc2-5028-4a27-9d88-ceaea064eba1.png",
  "exec-0f525307-3ef7-42bf-99f9-bd9c52cc0489.png",
  "exec-4b015190-d723-479e-9830-9d2d634e3664.png",
  "exec-cc509f50-9937-427d-9e12-3449d7db1636.png",
  "exec-8b063316-d5de-4a63-9ad6-fd1bcb9ccb09.png",
  "exec-76f99e06-bb1e-4709-8b4f-baf83a7d37a7.png",
  "exec-ec31a5a9-9141-4e05-9943-995ef2a10bf4.png",
  "exec-1c39fbba-0f1f-4bf7-86c4-f76a4f13594b.png",
  "exec-7dffe241-8def-4847-81dd-0e5a8ff04b67.png",
  "exec-05e42542-bd30-46d9-ad18-687a2889827a.png",
];

const recoverySlugs = [
  "scarpin-salto-baixo-fino-jeans",
  "scarpin-salto-baixo-fino-linho",
  "scarpin-salto-baixo-fino-napa-prata",
  "scarpin-salto-baixo-fino-verniz-preto",
  "scarpin-salto-baixo-fino-verniz-vermelho",
  "scarpin-salto-baixo-fino-xadrez",
];
const missing = recoverySlugs.map((slug) => manifest.find((item) => item.slug === slug));
const cellW = 360;
const cellH = 480;
const labelH = 58;
const canvas = sharp({
  create: { width: cellW * 3, height: (cellH + labelH) * 6, channels: 3, background: "#ece8e2" },
});

const composites = [];
for (let row = 0; row < missing.length; row++) {
  const item = missing[row];
  const files = [
    item.original,
    path.join(generatedDir, rawNames[row * 2]),
    path.join(generatedDir, rawNames[row * 2 + 1]),
  ];
  const labels = ["ORIGINAL", "PERFIL", "ANGULO"];
  for (let col = 0; col < 3; col++) {
    const image = await sharp(files[col])
      .flatten({ background: "#ffffff" })
      .resize({ width: cellW, height: cellH, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 86 })
      .toBuffer();
    composites.push({ input: image, left: col * cellW, top: row * (cellH + labelH) });
    const safe = `${labels[col]} — ${item.slug}`.replaceAll("&", "&amp;");
    const label = Buffer.from(`<svg width="${cellW}" height="${labelH}"><rect width="100%" height="100%" fill="#1a1613"/><text x="16" y="34" fill="#fff" font-family="Arial" font-size="14">${safe}</text></svg>`);
    composites.push({ input: label, left: col * cellW, top: row * (cellH + labelH) + cellH });
  }
}

const out = path.join(outputDir, "auditoria-recuperacao-scarpins.jpg");
await canvas.composite(composites).jpeg({ quality: 90 }).toFile(out);
console.log(out);
