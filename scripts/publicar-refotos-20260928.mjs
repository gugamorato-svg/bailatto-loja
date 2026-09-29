import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const CATALOG_PATH = "data/products.json";
const MAPPING_PATH =
  "C:/Users/Gustavo/Desktop/Sapatos Bailatto/_fundo-neutro-deterministico-2026-09-28/mapeamento-produtos.json";
const FINAL_DIR =
  "C:/Users/Gustavo/Desktop/Sapatos Bailatto/_fundo-neutro-deterministico-2026-09-28/fotos-finais";
const GALLERY_PREFIX = "galeria/20260928";
const BUCKET = "bailatto";
const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 1500;
const EXPECTED_BATCH = {
  sourceProducts: 113,
  mappedSourceProducts: 108,
  productsToUpdate: 106,
  filesToUpload: 227,
  skippedSourceProducts: 5,
};
const INTENTIONAL_DUPLICATE_TARGETS = new Set([
  "sandalia-croco-marrom",
  "scarpin-salto-alto-jeans",
]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente.");
if (APPLY && !serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente.");

const publicCatalogUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${CATALOG_PATH}`;
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
const skipped = mapping.filter((row) => !row.slug);
const mappedRows = mapping.filter((row) => row.slug);

const grouped = new Map();
for (const row of mappedRows) {
  const current = grouped.get(row.slug) ?? [];
  current.push(row);
  grouped.set(row.slug, current);
}

for (const [slug, rows] of grouped) {
  if (rows.length > 1 && !INTENTIONAL_DUPLICATE_TARGETS.has(slug)) {
    throw new Error(`Destino duplicado não auditado: ${slug}`);
  }
}

const publicResponse = await fetch(`${publicCatalogUrl}?prepare=${Date.now()}`, {
  cache: "no-store",
});
if (!publicResponse.ok) throw new Error(`Catálogo público: HTTP ${publicResponse.status}`);
const publicCatalog = await publicResponse.json();
const catalogBySlug = new Map(publicCatalog.map((product) => [product.slug, product]));

const publication = [];
for (const [slug, rows] of grouped) {
  const product = catalogBySlug.get(slug);
  if (!product) throw new Error(`Produto não existe no catálogo: ${slug}`);
  if (product.active === false) throw new Error(`Produto inativo: ${slug}`);

  const fileNames = [...new Set(rows.flatMap((row) => row.files))];
  if (fileNames.length < 1 || fileNames.length > 4) {
    throw new Error(`${slug}: quantidade inválida de fotos (${fileNames.length}).`);
  }

  const assets = [];
  for (const [index, fileName] of fileNames.entries()) {
    const filePath = path.join(FINAL_DIR, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Foto final ausente: ${filePath}`);
    const metadata = await sharp(filePath).metadata();
    if (
      metadata.format !== "jpeg" ||
      metadata.width !== EXPECTED_WIDTH ||
      metadata.height !== EXPECTED_HEIGHT
    ) {
      throw new Error(
        `${fileName}: esperado JPEG ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}; recebido ${metadata.format} ${metadata.width}x${metadata.height}.`,
      );
    }
    const body = fs.readFileSync(filePath);
    const destination = `${GALLERY_PREFIX}/${slug}-${String(index + 1).padStart(2, "0")}.jpg`;
    assets.push({
      fileName,
      filePath,
      destination,
      bytes: body.length,
      sha256: crypto.createHash("sha256").update(body).digest("hex"),
    });
  }
  publication.push({ slug, name: product.name, assets });
}

const totalFiles = publication.reduce((sum, item) => sum + item.assets.length, 0);
const totalBytes = publication.reduce(
  (sum, item) => sum + item.assets.reduce((assetSum, asset) => assetSum + asset.bytes, 0),
  0,
);

const actualBatch = {
  sourceProducts: mapping.length,
  mappedSourceProducts: mappedRows.length,
  productsToUpdate: publication.length,
  filesToUpload: totalFiles,
  skippedSourceProducts: skipped.length,
};
for (const [key, expected] of Object.entries(EXPECTED_BATCH)) {
  if (actualBatch[key] !== expected) {
    throw new Error(`Lote divergente em ${key}: esperado ${expected}; recebido ${actualBatch[key]}.`);
  }
}

const preparation = {
  mode: APPLY ? "apply" : "dry-run",
  catalogProducts: publicCatalog.length,
  sourceProducts: mapping.length,
  mappedSourceProducts: mappedRows.length,
  productsToUpdate: publication.length,
  filesToUpload: totalFiles,
  uploadMiB: Number((totalBytes / 1024 / 1024).toFixed(2)),
  intentionalMergedProducts: [...INTENTIONAL_DUPLICATE_TARGETS],
  skipped: skipped.map((row) => ({
    sourceProduct: row.sourceProduct,
    files: row.files.length,
    reason: row.skipReason ?? "sem correspondência no catálogo",
  })),
};
console.log(JSON.stringify(preparation, null, 2));

if (!APPLY) {
  console.log("DRY-RUN concluído. Use --apply somente após a confirmação final.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = supabase.storage.from(BUCKET);

async function parallel(items, concurrency, task) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}

const flatAssets = publication.flatMap((item) =>
  item.assets.map((asset) => ({ ...asset, slug: item.slug })),
);
let uploaded = 0;
await parallel(flatAssets, 5, async (asset) => {
  const { error } = await bucket.upload(asset.destination, fs.readFileSync(asset.filePath), {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw new Error(`${asset.destination}: ${error.message}`);
  uploaded++;
  if (uploaded % 20 === 0 || uploaded === flatAssets.length) {
    console.log(`Upload: ${uploaded}/${flatAssets.length}`);
  }
});

async function verifyAsset(asset) {
  const publicUrl = bucket.getPublicUrl(asset.destination).data.publicUrl;
  const maximumAttempts = 6;
  for (let attempt = 1; attempt <= maximumAttempts; attempt++) {
    const response = await fetch(`${publicUrl}?verify=${asset.sha256.slice(0, 12)}`, {
      method: "HEAD",
      cache: "no-store",
    });
    if (response.ok) {
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength !== asset.bytes) {
        throw new Error(
          `Tamanho remoto divergente: ${asset.destination} (${contentLength} != ${asset.bytes}).`,
        );
      }
      return;
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maximumAttempts) {
      throw new Error(
        `Verificação HTTP falhou: ${asset.destination} (${response.status}, tentativa ${attempt}).`,
      );
    }
    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const delayMs = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : 750 * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

await parallel(flatAssets, 3, verifyAsset);

const { data: currentCatalogBlob, error: catalogDownloadError } = await bucket.download(CATALOG_PATH);
if (catalogDownloadError || !currentCatalogBlob) {
  throw new Error(catalogDownloadError?.message ?? "Catálogo atual não pôde ser baixado.");
}
const currentCatalogText = await currentCatalogBlob.text();
const catalog = JSON.parse(currentCatalogText);
const updateBySlug = new Map(publication.map((item) => [item.slug, item]));
let oldGalleryReferencesRemoved = 0;

for (const product of catalog) {
  const currentImages = Array.isArray(product.images) ? product.images : [];
  const retainedImages = currentImages.filter((url) => {
    const isOldGeneratedGallery = /\/galeria\/[^?]+-20260903\.jpg(?:\?|$)/i.test(url);
    if (isOldGeneratedGallery) oldGalleryReferencesRemoved++;
    return !isOldGeneratedGallery;
  });
  const update = updateBySlug.get(product.slug);
  if (update) {
    product.images = update.assets.map(
      (asset) => bucket.getPublicUrl(asset.destination).data.publicUrl,
    );
  } else if (retainedImages.length) {
    product.images = retainedImages;
  } else {
    delete product.images;
  }
}

const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backupPath = `data/backup-products-refotos-${timestamp}.json`;
const { error: backupError } = await bucket.upload(backupPath, currentCatalogText, {
  contentType: "application/json; charset=utf-8",
  cacheControl: "31536000",
  upsert: false,
});
if (backupError) throw new Error(`Backup do catálogo: ${backupError.message}`);

const nextCatalogText = `${JSON.stringify(catalog, null, 2)}\n`;
const { error: catalogUploadError } = await bucket.upload(
  CATALOG_PATH,
  Buffer.from(nextCatalogText, "utf8"),
  {
    contentType: "application/json; charset=utf-8",
    cacheControl: "60",
    upsert: true,
  },
);
if (catalogUploadError) throw new Error(`Atualização do catálogo: ${catalogUploadError.message}`);

const { data: verifiedBlob, error: verifiedDownloadError } = await bucket.download(CATALOG_PATH);
if (verifiedDownloadError || !verifiedBlob) {
  throw new Error(verifiedDownloadError?.message ?? "Catálogo atualizado não pôde ser verificado.");
}
const verifiedCatalog = JSON.parse(await verifiedBlob.text());
const verifiedBySlug = new Map(verifiedCatalog.map((product) => [product.slug, product]));
for (const item of publication) {
  const expected = item.assets.map(
    (asset) => bucket.getPublicUrl(asset.destination).data.publicUrl,
  );
  const actual = verifiedBySlug.get(item.slug)?.images ?? [];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Catálogo verificado diverge para ${item.slug}.`);
  }
}

console.log(
  JSON.stringify(
    {
      publishedProducts: publication.length,
      publishedFiles: flatAssets.length,
      oldGalleryReferencesRemoved,
      backupPath,
      catalogPath: CATALOG_PATH,
      verified: true,
    },
    null,
    2,
  ),
);
