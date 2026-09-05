import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const RAIZ =
  "C:/Users/Gustavo/Desktop/Sapatos Bailatto/Calzados Bailatto-20260830T202203Z-1-001/Calzados Bailatto";
const PUBLICO = path.resolve("public/produtos");
const AUDITORIA = path.resolve("_auditoria-fotos-20260830");
const BACKUP = path.resolve("_backup-fotos-20260830");
const PUBLICAR = process.argv.includes("--publicar-catalogo");
const VERSAO = "editorial-20260830";
const LARGURA = 1200;
const ALTURA = 1500;

const FOTOS = [
  ["Botas/BFP.jfif", "bota-fivela-baixo-preto"],
  ["Botas/BM.jfif", "bota-suede-marrom"],
  ["Botas/BN.jfif", "bota-croco-preto"],
  ["Botas/BNM.jfif", "bota-napa-marrom"],
  ["Chinelos/CBrilhoA.jfif", "chinelo-brilho-amarelo"],
  ["Chinelos/CBrilhoBeige.jfif", "chinelo-brilho-bege"],
  ["Chinelos/CBrilhoC.jfif", "chinelo-brilho-cinza"],
  ["Chinelos/CBrilhoM.jfif", "chinelo-brilho-marrom"],
  ["Chinelos/CSimplesP.jfif", "chinelo-simples-preto"],
  ["Mocassins/MCH1.jfif", "mocassim-suede-cinza"],
  ["Mocassins/MNAH2.jfif", "mocassim-napa-azul"],
  ["Mocassins/MNBH2.jfif", "mocassim-napa-branco"],
  ["Mocassins/MNH1.jfif", "mocassim-suede-nude"],
  ["Mocassins/MNMH2.jfif", "mocassim-napa-marrom"],
  ["Mocassins/MNNH1.jfif", "mocassim-napa-nude"],
  ["Mocassins/MNVH1.jfif", "mocassim-napa-vinho"],
  ["Mocassins/MSMH1.jfif", "mocassim-suede-marrom"],
  ["Mocassins/MSVH1.jfif", "mocassim-suede-verde"],
  ["Rasteirinhas/RN.jfif", "rasteira-6-tiras-nude"],
  ["Scarpin Slingback/Scarpin Slingback Azul.jpg", "scarpin-slingback-azul"],
  ["Scarpin Slingback/Scarpin Slingback Marrom.jpg", "scarpin-slingback-marrom"],
  ["Scarpin Slingback/Scarpin Slingback Off White.jpg", "scarpin-slingback-off-white"],
  ["Scarpin Slingback/ScarSlimMc.jfif", "scarpin-slingback-marrom-claro"],
  ["Scarpin Slingback/ScarSlimN.jfif", "scarpin-slingback-nude"],
  ["Scarpin Slingback/ScarSlimP.jfif", "scarpin-slingback-preto"],
  ["Scarpin Slingback/ScarSlimV.jfif", "scarpin-slingback-vinho"],
  ["Tamancos/TDN.jfif", "tamanco-dedo-nude"],
  ["Tamancos/TDP.jfif", "tamanco-dedo-preto"],
  ["Tamancos/TFA.jfif", "tamanco-fivela-azul"],
];

fs.mkdirSync(AUDITORIA, { recursive: true });
fs.mkdirSync(BACKUP, { recursive: true });

const catalogoUrl =
  "https://tgnxixkmwgifqrksejgg.supabase.co/storage/v1/object/public/bailatto/data/products.json";
const resposta = await fetch(`${catalogoUrl}?t=${Date.now()}`);
if (!resposta.ok) throw new Error(`Falha ao baixar catálogo: HTTP ${resposta.status}`);
const produtos = await resposta.json();
const porSlug = new Map(produtos.map((produto) => [produto.slug, produto]));

for (const [relativo, slug] of FOTOS) {
  const origem = path.join(RAIZ, relativo);
  if (!fs.existsSync(origem)) throw new Error(`Foto de origem ausente: ${origem}`);
  if (!porSlug.has(slug)) throw new Error(`Produto não encontrado no catálogo: ${slug}`);
}

async function prepararImagem(origem, destino) {
  const base = sharp(origem).rotate().flatten({ background: "#ffffff" });
  const recortada = await base
    .trim({ background: "#ffffff", threshold: 22 })
    .modulate({ brightness: 1.01, saturation: 0.98 })
    .sharpen({ sigma: 0.55, m1: 0.5, m2: 1.2 })
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toBuffer();

  const frente = await sharp(recortada)
    .resize({
      width: 1080,
      height: 1180,
      fit: "inside",
      withoutEnlargement: false,
    })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((LARGURA - frente.info.width) / 2);
  const top = Math.max(70, Math.round((ALTURA - frente.info.height) / 2) - 20);
  await sharp({
    create: {
      width: LARGURA,
      height: ALTURA,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([{ input: frente.data, left, top }])
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(destino);
}

const alteracoes = [];
for (const [relativo, slug] of FOTOS) {
  const produto = porSlug.get(slug);
  const origemAtual = path.resolve("public", produto.image.replace(/^\//, ""));
  if (fs.existsSync(origemAtual)) {
    fs.copyFileSync(origemAtual, path.join(BACKUP, `${slug}${path.extname(origemAtual) || ".jpg"}`));
  }

  const nomeNovo = `${slug}-${VERSAO}.jpg`;
  const destino = path.join(PUBLICO, nomeNovo);
  await prepararImagem(path.join(RAIZ, relativo), destino);
  produto.image = `/produtos/${nomeNovo}`;
  alteracoes.push({ slug, nome: produto.name, origem: relativo, imagem: produto.image });
}

const catalogoAtualizado = path.join(AUDITORIA, "products-editorial-20260830.json");
fs.writeFileSync(catalogoAtualizado, JSON.stringify(produtos, null, 2));
fs.writeFileSync(
  path.join(AUDITORIA, "mapeamento-editorial-20260830.json"),
  JSON.stringify(alteracoes, null, 2),
);

if (PUBLICAR) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Variáveis do Supabase ausentes.");
  const supabase = createClient(url, chave, { auth: { persistSession: false } });
  const bucket = supabase.storage.from("bailatto");
  const carimbo = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const original = Buffer.from(JSON.stringify(await (await fetch(`${catalogoUrl}?b=${Date.now()}`)).json(), null, 2));
  const atualizado = Buffer.from(JSON.stringify(produtos, null, 2));

  const backup = await bucket.upload(`data/backup-products-${carimbo}.json`, original, {
    contentType: "application/json",
    upsert: false,
  });
  if (backup.error) throw backup.error;

  const envio = await bucket.upload("data/products.json", atualizado, {
    contentType: "application/json",
    cacheControl: "60",
    upsert: true,
  });
  if (envio.error) throw envio.error;
  console.log(`Catálogo publicado com ${alteracoes.length} novas imagens.`);
} else {
  console.log("Prévia criada. O catálogo ainda não foi alterado.");
}

console.log(JSON.stringify(alteracoes, null, 2));
