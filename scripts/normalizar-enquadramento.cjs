// Reenquadra as fotos de calçado para o padrão das marcas grandes, medido em
// cards reais da Santa Lolla e da Larroudé: produto em 80% da largura, margem
// lateral de ~9% e centro óptico a 53% da altura (não no meio geométrico —
// centralizado na régua o produto parece afundado).
//
// NÃO usa IA: só detecta o contorno do produto, redimensiona e reposiciona.
// O pixel do produto é o mesmo — é o oposto do que quebrou com o Wan.
//
//   node scripts/normalizar-enquadramento.cjs --amostra   -> 8 fotos, sem gravar
//   node scripts/normalizar-enquadramento.cjs --dry       -> mede todas, sem gravar
//   node scripts/normalizar-enquadramento.cjs             -> grava + sobe no bucket
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

const AMOSTRA = process.argv.includes("--amostra");
const DRY = process.argv.includes("--dry") || AMOSTRA;
const W = 1200, H = 1500;
const BG = { r: 251, g: 250, b: 248 };        // #FBFAF8, o fundo do site
const ALVO_LARG = 0.80, MAX_ALT = 0.68, CY = 0.53;
const BACKUP = "_prereframe";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

/** Contorno do produto: primeiro pixel que não é o branco do fundo. */
async function bbox(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * c;
      if (Math.abs(data[i] - 255) > 14 || Math.abs(data[i + 1] - 255) > 14 || Math.abs(data[i + 2] - 255) > 14) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, w, h };
}

async function normalizar(buf) {
  const b = await bbox(buf);
  const bw = b.maxX - b.minX + 1, bh = b.maxY - b.minY + 1;
  if (maxX_invalido(b, bw, bh)) return null;

  // Produto encostando na borda da foto original = pixel que nunca foi
  // capturado. Reenquadrar não recupera: só avisa para refotografar.
  const cortado = b.minX <= 1 || b.minY <= 1 || b.maxX >= b.w - 2 || b.maxY >= b.h - 2;

  let esc = (W * ALVO_LARG) / bw;
  if (bh * esc > H * MAX_ALT) esc = (H * MAX_ALT) / bh;
  const nw = Math.round(bw * esc), nh = Math.round(bh * esc);

  const recorte = await sharp(buf).extract({ left: b.minX, top: b.minY, width: bw, height: bh })
    .resize(nw, nh, { kernel: "lanczos3" }).toBuffer();

  // Troca o branco residual pelo tom do site, senão sobra um halo claro.
  const { data, info } = await sharp(recorte).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.max(Math.abs(data[i] - 255), Math.abs(data[i + 1] - 255), Math.abs(data[i + 2] - 255));
    if (d < 10) { data[i] = BG.r; data[i + 1] = BG.g; data[i + 2] = BG.b; }
  }
  const limpo = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().toBuffer();

  const jpg = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([{ input: limpo, left: Math.round((W - nw) / 2), top: Math.max(0, Math.round(H * CY - nh / 2)) }])
    .jpeg({ quality: 90, mozjpeg: true }).toBuffer();

  return { jpg, cortado, ocupaLarg: nw / W, ocupaAlt: nh / H };
}

/** Contorno degenerado = produto quase todo branco que o limiar não pegou. */
function maxX_invalido(b, bw, bh) {
  return b.maxX < 0 || bw < b.w * 0.15 || bh < b.h * 0.15;
}

(async () => {
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: dl, error } = await sb.storage.from("bailatto").download("data/products.json");
  if (error) throw error;
  const catalogo = JSON.parse(await dl.text());
  let alvos = catalogo.filter((p) => !p.tamanhoUnico);
  if (AMOSTRA) alvos = alvos.slice(0, 8);

  if (!DRY) fs.mkdirSync(BACKUP, { recursive: true });
  const largs = [], alts = [];
  let ok = 0, pulados = 0;
  const cortados = [], falhas = [];

  for (const p of alvos) {
    const arq = "public" + p.image;
    if (!fs.existsSync(arq)) { falhas.push(p.slug + " (arquivo local sumido)"); continue; }
    const orig = fs.readFileSync(arq);
    const r = await normalizar(orig);
    if (!r) { pulados++; falhas.push(p.slug + " (contorno não detectado)"); continue; }

    largs.push(r.ocupaLarg); alts.push(r.ocupaAlt);
    if (r.cortado) cortados.push(p.slug);

    if (!DRY) {
      // backup antes de sobrescrever — dá para reverter tudo
      const nome = path.basename(arq);
      if (!fs.existsSync(`${BACKUP}/${nome}`)) fs.writeFileSync(`${BACKUP}/${nome}`, orig);
      fs.writeFileSync(arq, r.jpg);
      const { error: e } = await sb.storage.from("bailatto")
        .upload("produtos/" + nome, r.jpg, { contentType: "image/jpeg", upsert: true });
      if (e) { falhas.push(p.slug + " (upload: " + e.message + ")"); continue; }
    }
    ok++;
    if (ok % 25 === 0) console.log("  ..." + ok);
  }

  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const min = (a) => Math.min(...a), max = (a) => Math.max(...a);
  console.log(`\nprocessadas: ${ok} | puladas: ${pulados}`);
  console.log(`largura ocupada  mediana ${(med(largs) * 100).toFixed(0)}%  (min ${(min(largs) * 100).toFixed(0)}% / max ${(max(largs) * 100).toFixed(0)}%)`);
  console.log(`altura ocupada   mediana ${(med(alts) * 100).toFixed(0)}%  (min ${(min(alts) * 100).toFixed(0)}% / max ${(max(alts) * 100).toFixed(0)}%)`);
  if (cortados.length) console.log(`\n⚠ cortadas na origem (precisam de refoto): ${cortados.length}\n   ` + cortados.join("\n   "));
  if (falhas.length) console.log(`\n✗ falhas:\n   ` + falhas.join("\n   "));
  if (DRY) console.log("\n(nada gravado)");
  else console.log(`\n✓ originais guardados em ${BACKUP}/`);
})();
