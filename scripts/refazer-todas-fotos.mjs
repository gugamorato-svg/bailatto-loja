import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

/**
 * Regra única para TODA foto de produto: o calçado nunca pode ser cortado.
 * O card é 3:2; as fotos vêm em orientações diferentes (as novas deitadas,
 * as antigas em pé). Em vez de recortar — que decepa bico e salto — a foto
 * inteira é encaixada no quadro e as sobras são preenchidas com a cor da
 * própria borda da imagem, o que deixa a emenda imperceptível.
 */

const NOVAS = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";
const ANTIGAS = "C:/Users/Gustavo/Downloads/fotos sapatos";
const DEST = "public/produtos";
const L = 1200;
const A = 800;

const MAPA_ANTIGAS = {
  "20f7067d-a1f0-4232-ba26-b1801a7bc158": "sandalia-bloco-suede-marrom",
  "303be54b-9c33-485e-b53b-010df6de96c6": "sandalia-bico-folha-azul",
  "649f0346-e76b-497a-a7c6-c2f871bf0e54": "sandalia-dedo-alto-off-white",
  "91e8d475-6a77-4269-9e35-0b7ccfc8fef2": "sandalia-salto-minimo-x-preto",
  "d5f770dc-7fec-4142-8648-9f38d0db8872": "sandalia-croco-preto",
  "003f72c9-0b79-46ac-b119-e1503bdf2a6b": "bota-suede-marrom",
  "79cf0467-c40f-4289-ade5-6ea8f4d0b3c2": "bota-croco-preto",
  "9c34221a-2143-4f3e-8e26-d2edc8fcf37d": "bota-fivela-baixo-preto",
  "e5d843fd-70f7-44f8-8591-ecaad4f46c1a": "bota-napa-marrom",
  "510a0108-e1da-4b71-a2fa-c7165f3bbab3": "rasteira-6-tiras-nude",
  "8d1a0d84-5404-47cc-a54e-99c6a531d390": "rasteira-x-prata",
  "b12b7f33-df57-4db2-a915-26bc367054eb": "rasteira-no-cobre",
  "35daa958-63e8-4a18-8d7f-2df63570ad56": "mocassim-off-white",
  "81e594c4-e565-459c-9402-609f01aff583": "mocassim-suede-cinza",
  "b0561b09-7af6-4701-9455-fca10a060740": "mocassim-marrom",
  "5f1ed54a-506d-4484-b4b4-8a01f20cdc2c": "tenis-casual-plataforma-preto",
  "80f30e20-a12d-4cd1-bca7-ce5f9d88cb96": "tenis-casual-retro-branco",
  "2ea91ca8-1482-4181-9595-602036f48849": "tamanco-fivela-azul",
  "b218e2d3-fd60-4850-b6ba-78a4f9de7b7d": "papete-3-tiras-prata",
  "df96a229-55a2-471d-bd2a-8c5c632159a7": "papete-3-tiras-nude",
};

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

// slug -> arquivo de origem
const origem = new Map();
for (const [uuid, slug] of Object.entries(MAPA_ANTIGAS)) {
  origem.set(slug, path.join(ANTIGAS, uuid + ".jpg"));
}
for (const f of fs.readdirSync(NOVAS).filter((x) => /\.(jpe?g|png|webp)$/i.test(x))) {
  origem.set(slugify(path.parse(f).name), path.join(NOVAS, f));
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
let data = null;
for (let t = 1; t <= 4 && !data; t++) {
  ({ data } = await sb.storage.from("bailatto").download("data/products.json"));
  if (!data) await new Promise((r) => setTimeout(r, 1500));
}
if (!data) { console.error("nao consegui baixar a lista de produtos"); process.exit(1); }
const produtos = JSON.parse(await data.text());

let feitas = 0;
const semOrigem = [];

for (const p of produtos) {
  const slug = path.parse(p.image).name;
  const src = origem.get(slug);
  if (!src || !fs.existsSync(src)) {
    semOrigem.push(p.name);
    continue;
  }

  const m = await sharp(src).metadata();
  const emPe = m.height > m.width;

  // Nas fotos em pé há teto e mesa vazios em cima e embaixo. Tirar essa
  // sobra antes faz o calçado ocupar bem mais espaço no quadro final.
  const top = emPe ? Math.round(m.height * 0.18) : 0;
  const alt = emPe ? Math.round(m.height * 0.64) : m.height;

  const recorte = { left: 0, top, width: m.width, height: alt };

  // A sobra é preenchida com a própria foto ampliada e desfocada. Fica muito
  // melhor que uma tarja de cor chapada: some a emenda e o quadro parece cheio,
  // sem que nenhum pedaço do calçado seja cortado.
  const fundo = await sharp(src)
    .extract(recorte)
    .resize({ width: L, height: A, fit: "cover" })
    .blur(28)
    .modulate({ brightness: 1.06, saturation: 0.7 })
    .toBuffer();

  const frente = await sharp(src)
    .extract(recorte)
    .resize({ width: L, height: A, fit: "inside" })
    .modulate({ brightness: 1.03 })
    .sharpen({ sigma: 0.6 })
    .toBuffer();
  const f = await sharp(frente).metadata();

  await sharp(fundo)
    .composite([
      {
        input: frente,
        left: Math.round((L - f.width) / 2),
        top: Math.round((A - f.height) / 2),
      },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(DEST, slug + ".jpg"));

  feitas++;
}

console.log(`${feitas} de ${produtos.length} fotos refeitas (nada cortado)`);
if (semOrigem.length) {
  console.log(`\nsem arquivo de origem (${semOrigem.length}):`);
  for (const n of semOrigem) console.log(" -", n);
}
