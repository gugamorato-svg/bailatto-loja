// Gera a imagem da tabela de numeração (a mesma do site) e publica no bucket
// público do Supabase, para usar como "Tabela de medidas" no TikTok Shop.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

// Mesma tabela de src/components/GuiaNumeracao.tsx
const TABELA = [
  [33, "21,3"], [34, "22,0"], [35, "22,7"], [36, "23,3"],
  [37, "24,0"], [38, "24,7"], [39, "25,3"], [40, "26,0"],
];

const L = 900;
const A = 1000;
const linhaAltura = 62;
const topoTabela = 330;

const linhas = TABELA.map(([num, cm], i) => {
  const y = topoTabela + i * linhaAltura;
  const fundo = i % 2 === 0 ? "#F7F2F3" : "#FFFFFF";
  return `
    <rect x="90" y="${y}" width="720" height="${linhaAltura}" fill="${fundo}"/>
    <text x="230" y="${y + 40}" font-family="Georgia, serif" font-size="30" fill="#241B1E" text-anchor="middle">${num}</text>
    <text x="620" y="${y + 40}" font-family="Georgia, serif" font-size="30" fill="#6E5A60" text-anchor="middle">${cm} cm</text>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}">
  <rect width="${L}" height="${A}" fill="#FFFFFF"/>
  <text x="${L / 2}" y="90" font-family="Georgia, serif" font-size="44" letter-spacing="6" fill="#7A2740" text-anchor="middle">BAILATTO</text>
  <text x="${L / 2}" y="150" font-family="Georgia, serif" font-size="34" fill="#241B1E" text-anchor="middle">Tabela de Numeração</text>

  <text x="${L / 2}" y="215" font-family="Helvetica, Arial, sans-serif" font-size="21" fill="#6E5A60" text-anchor="middle">Pise numa folha de papel, marque o calcanhar e a ponta do</text>
  <text x="${L / 2}" y="245" font-family="Helvetica, Arial, sans-serif" font-size="21" fill="#6E5A60" text-anchor="middle">dedão, meça a distância em centímetros e compare abaixo.</text>

  <rect x="90" y="${topoTabela - 52}" width="720" height="52" fill="#7A2740"/>
  <text x="230" y="${topoTabela - 16}" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#FFFFFF" text-anchor="middle">NUMERAÇÃO</text>
  <text x="620" y="${topoTabela - 16}" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#FFFFFF" text-anchor="middle">COMPRIMENTO DO PÉ</text>
  ${linhas}
  <rect x="90" y="${topoTabela - 52}" width="720" height="${52 + TABELA.length * linhaAltura}" fill="none" stroke="#E4D6D9" stroke-width="2"/>

  <text x="${L / 2}" y="${A - 55}" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#6E5A60" text-anchor="middle">Entre dois números? Em bico fino, prefira o maior.</text>
  <text x="${L / 2}" y="${A - 25}" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#9C8890" text-anchor="middle">bailatto.com.br</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(new URL("tabela-numeracao.png", raiz), png);
console.log(`imagem gerada: ${L}x${A}, ${(png.length / 1024) | 0} KB`);

// A chave de serviço é do formato novo (sb_secret_…), não um JWT — o REST cru
// recusa com "Invalid Compact JWS". O cliente oficial lida com isso.
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const caminho = "publico/tabela-numeracao.png";
const { error } = await supabase.storage
  .from("bailatto")
  .upload(caminho, png, { contentType: "image/png", upsert: true });

if (error) {
  console.error("falha ao publicar:", error.message);
  process.exit(1);
}

const publica = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/${caminho}`;
console.log("publicada em:", publica);

const conf = await fetch(publica, { method: "HEAD" });
console.log("confere:", conf.status, conf.headers.get("content-type"));
