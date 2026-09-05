import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const CATALOGO = "data/products.json";
const raiz = process.cwd();
const diretorio = path.join(raiz, "output", "imagegen", "galerias-bailatto-20260903");
const manifest = JSON.parse(fs.readFileSync(path.join(diretorio, "manifest.json"), "utf8"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) throw new Error("Variáveis do Supabase ausentes.");

const supabase = createClient(url, chave, { auth: { persistSession: false } });
const bucket = supabase.storage.from("bailatto");
const { data: arquivoAtual, error: erroDownload } = await bucket.download(CATALOGO);
if (erroDownload || !arquivoAtual) throw erroDownload ?? new Error("Catálogo não encontrado.");
const textoAtual = await arquivoAtual.text();
const produtos = JSON.parse(textoAtual);
const porSlug = new Map(produtos.map((produto) => [produto.slug, produto]));
const prontos = manifest.filter(
  (item) => fs.existsSync(item.outputProfile) && fs.existsSync(item.outputAngle),
);

if (!prontos.length) throw new Error("Nenhuma galeria completa para publicar.");

for (const item of prontos) {
  const produto = porSlug.get(item.slug);
  if (!produto) throw new Error(`Produto não encontrado: ${item.slug}`);
  const arquivos = [
    [item.outputProfile, `galeria/${item.slug}-perfil-20260903.jpg`],
    [item.outputAngle, `galeria/${item.slug}-angulo-20260903.jpg`],
  ];
  const urls = [];
  for (const [arquivo, destino] of arquivos) {
    const envio = await bucket.upload(destino, fs.readFileSync(arquivo), {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: true,
    });
    if (envio.error) throw envio.error;
    urls.push(bucket.getPublicUrl(destino).data.publicUrl);
  }
  produto.images = urls;
}

const carimbo = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backup = await bucket.upload(`data/backup-products-${carimbo}.json`, textoAtual, {
  contentType: "application/json",
  upsert: false,
});
if (backup.error) throw backup.error;

const atualizacao = await bucket.upload(CATALOGO, JSON.stringify(produtos, null, 2), {
  contentType: "application/json",
  cacheControl: "60",
  upsert: true,
});
if (atualizacao.error) throw atualizacao.error;

console.log(JSON.stringify({ galeriasPublicadas: prontos.length, backup: `data/backup-products-${carimbo}.json` }, null, 2));

