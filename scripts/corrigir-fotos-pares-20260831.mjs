import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const PUBLICAR = process.argv.includes("--publicar-catalogo");
const RAIZ = process.cwd();
const PRODUTOS = path.join(RAIZ, "public", "produtos");
const AUDITORIA = path.join(RAIZ, "_auditoria-correcoes-20260831");
const GERADAS =
  "C:/Users/Gustavo/.codex/generated_images/01a048db-8791-7341-b749-88376afce1c3";
const VERSAO = "studio-v2-20260831";

const FOTOS = [
  ["sapatilha-laco-cromado-branco", "exec-ed9d2b02-ffc0-4776-940a-203588b35180.png"],
  ["sapatilha-napa-no-brilho-preto", "exec-9805b8c3-f8a2-401b-8bf0-7b9dd85cf755.png"],
  ["chinelo-concha-marrom", "exec-556a529f-498d-42f8-8563-d79466581e19.png"],
  ["sandalia-croco-vermelho", "exec-016f7133-1f4c-46e6-917f-12fcc39f2e37.png"],
  ["sandalia-dedo-alto-marrom", "exec-85226189-bc8f-4fdc-8827-0072c4431ce4.png"],
  ["sandalia-dedo-alto-off-white", "exec-f1d83e84-40ef-4dbf-8e5c-ad99601cc7d5.png"],
  ["sandalia-dedo-alto-preto", "exec-4b3fce06-c6bb-49ca-8e11-0a6c4a0b025d.png"],
];

const catalogoUrl =
  "https://tgnxixkmwgifqrksejgg.supabase.co/storage/v1/object/public/bailatto/data/products.json";

fs.mkdirSync(PRODUTOS, { recursive: true });
fs.mkdirSync(AUDITORIA, { recursive: true });

const resposta = await fetch(`${catalogoUrl}?t=${Date.now()}`);
if (!resposta.ok) throw new Error(`Falha ao baixar catálogo: HTTP ${resposta.status}`);
const produtos = await resposta.json();
const porSlug = new Map(produtos.map((produto) => [produto.slug, produto]));

for (const [slug, arquivo] of FOTOS) {
  const origem = path.join(GERADAS, arquivo);
  if (!fs.existsSync(origem)) throw new Error(`Imagem gerada ausente: ${origem}`);
  if (!porSlug.has(slug)) throw new Error(`Produto ausente no catálogo: ${slug}`);
}

const alteracoes = [];
for (const [slug, arquivo] of FOTOS) {
  const nomeNovo = `${slug}-${VERSAO}.jpg`;
  const destino = path.join(PRODUTOS, nomeNovo);
  await sharp(path.join(GERADAS, arquivo))
    .flatten({ background: "#ffffff" })
    .resize({ width: 1200, height: 1500, fit: "contain", background: "#ffffff" })
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(destino);

  const produto = porSlug.get(slug);
  produto.image = `/produtos/${nomeNovo}`;
  alteracoes.push({ slug, nome: produto.name, imagem: produto.image });
}

const cards = await Promise.all(
  alteracoes.map(async ({ slug, nome }) => {
    const foto = await sharp(path.join(PRODUTOS, `${slug}-${VERSAO}.jpg`))
      .resize({ width: 320, height: 400, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 86 })
      .toBuffer();
    const legenda = Buffer.from(`
      <svg width="320" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fbfaf8"/>
        <text x="14" y="426" font-family="Arial" font-size="13" fill="#1a1613">${nome
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")}</text>
      </svg>`);
    return sharp(legenda).composite([{ input: foto, left: 0, top: 0 }]).jpeg({ quality: 88 }).toBuffer();
  }),
);

await sharp({
  create: {
    width: 320 * 4,
    height: 450 * 2,
    channels: 3,
    background: "#fbfaf8",
  },
})
  .composite(
    cards.map((input, indice) => ({
      input,
      left: (indice % 4) * 320,
      top: Math.floor(indice / 4) * 450,
    })),
  )
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(AUDITORIA, "correcoes.jpg"));

fs.writeFileSync(
  path.join(AUDITORIA, "mapeamento.json"),
  JSON.stringify(alteracoes, null, 2),
);

if (PUBLICAR) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Variáveis do Supabase ausentes.");

  const supabase = createClient(url, chave, { auth: { persistSession: false } });
  const bucket = supabase.storage.from("bailatto");
  const carimbo = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const original = Buffer.from(
    JSON.stringify(await (await fetch(`${catalogoUrl}?b=${Date.now()}`)).json(), null, 2),
  );

  const backup = await bucket.upload(`data/backup-products-${carimbo}.json`, original, {
    contentType: "application/json",
    upsert: false,
  });
  if (backup.error) throw backup.error;

  const envio = await bucket.upload("data/products.json", Buffer.from(JSON.stringify(produtos, null, 2)), {
    contentType: "application/json",
    cacheControl: "60",
    upsert: true,
  });
  if (envio.error) throw envio.error;
  console.log(`Catálogo publicado com ${alteracoes.length} correções.`);
} else {
  console.log("Arquivos e auditoria preparados; catálogo ainda não alterado.");
}

console.log(JSON.stringify(alteracoes, null, 2));
