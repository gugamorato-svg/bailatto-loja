import crypto from "node:crypto";
import { getSupabaseAdmin, BUCKET, DATA_PATH } from "./supabaseAdmin";
import {
  products as seedProducts,
  type Product,
  type CategorySlug,
} from "./products";

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isDbConfigured(): boolean {
  return configured;
}

export type AdminProduct = Product & {
  id: string;
  active: boolean;
  promoPrice: number | null;
  sort: number;
};

export type ProductInput = {
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  promoPrice: number | null;
  sizes: number[];
  image: string;
  featured: boolean;
  active: boolean;
};

// ---------- armazenamento (JSON no Storage) ----------

async function loadAll(): Promise<AdminProduct[] | null> {
  try {
    const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).download(DATA_PATH);
    if (error || !data) return null;
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as AdminProduct[]) : null;
  } catch {
    return null;
  }
}

async function saveAll(list: AdminProduct[]): Promise<string | null> {
  const body = JSON.stringify(list, null, 2);
  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(DATA_PATH, body, { upsert: true, contentType: "application/json" });
  return error?.message ?? null;
}

// ---------- Vitrine (leitura pública) ----------

export async function getAllProducts(): Promise<Product[]> {
  if (!configured) return seedProducts;
  const list = await loadAll();
  if (!list || list.length === 0) return seedProducts;
  return list.filter((p) => p.active !== false);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  const featured = all.filter((p) => p.featured);
  return featured.length ? featured : all.slice(0, 8);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!configured) return seedProducts.find((p) => p.slug === slug) ?? null;
  const list = await loadAll();
  if (!list) return seedProducts.find((p) => p.slug === slug) ?? null;
  return list.find((p) => p.slug === slug && p.active !== false) ?? null;
}

// ---------- Admin ----------

export async function adminListProducts(): Promise<AdminProduct[]> {
  return (await loadAll()) ?? [];
}

export async function adminGetProduct(id: string): Promise<AdminProduct | null> {
  const list = await loadAll();
  return list?.find((p) => p.id === id) ?? null;
}

export async function adminCreateProduct(input: ProductInput): Promise<string | null> {
  const list = (await loadAll()) ?? [];
  let slug = input.slug;
  if (list.some((p) => p.slug === slug)) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const product: AdminProduct = {
    id: crypto.randomUUID(),
    slug,
    name: input.name,
    category: input.category as CategorySlug,
    description: input.description,
    price: input.price,
    promoPrice: input.promoPrice,
    sizes: input.sizes,
    image: input.image,
    featured: input.featured,
    active: input.active,
    sort: list.length,
  };
  list.push(product);
  return saveAll(list);
}

export async function adminUpdateProduct(id: string, input: ProductInput): Promise<string | null> {
  const list = (await loadAll()) ?? [];
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return "Produto não encontrado.";
  list[i] = {
    ...list[i],
    slug: input.slug || list[i].slug,
    name: input.name,
    category: input.category as CategorySlug,
    description: input.description,
    price: input.price,
    promoPrice: input.promoPrice,
    sizes: input.sizes,
    image: input.image,
    featured: input.featured,
    active: input.active,
  };
  return saveAll(list);
}

export async function adminDeleteProduct(id: string): Promise<string | null> {
  const list = (await loadAll()) ?? [];
  return saveAll(list.filter((p) => p.id !== id));
}

export async function adminUploadImage(file: File): Promise<{ url?: string; error?: string }> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `produtos/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) return { error: error.message };
  const { data } = getSupabaseAdmin().storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

// ---------------- Importação do Phibo ----------------

const IMPORT_TEMP_PATH = "data/import-temp.json";

/** Guarda a planilha lida para a tela de revisão (some ao aplicar). */
export async function salvarImportTemp(dados: unknown): Promise<string | null> {
  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(IMPORT_TEMP_PATH, JSON.stringify(dados), {
      upsert: true,
      contentType: "application/json",
    });
  return error?.message ?? null;
}

export async function lerImportTemp<T>(): Promise<T | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .download(IMPORT_TEMP_PATH);
    if (error || !data) return null;
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

export async function limparImportTemp(): Promise<void> {
  try {
    await getSupabaseAdmin().storage.from(BUCKET).remove([IMPORT_TEMP_PATH]);
  } catch {
    // se falhar, o próximo upload sobrescreve de qualquer forma
  }
}

export type ImportUpdate = {
  slug: string;
  phibo: string;
  price: number | null;
  estoque: Record<string, number>;
};

/** Aplica preço + estoque + vínculo do Phibo em vários produtos de uma vez. */
export async function adminApplyImport(
  updates: ImportUpdate[],
): Promise<{ atualizados: number; error?: string }> {
  const list = (await loadAll()) ?? [];
  let atualizados = 0;

  for (const u of updates) {
    const i = list.findIndex((p) => p.slug === u.slug);
    if (i < 0) continue;
    const sizes = Object.keys(u.estoque)
      .map(Number)
      .filter((n) => Number.isFinite(n) && u.estoque[String(n)] > 0)
      .sort((a, b) => a - b);

    list[i] = {
      ...list[i],
      phibo: u.phibo,
      estoque: u.estoque,
      price: u.price ?? list[i].price,
      // só troca as numerações se a planilha trouxe alguma com estoque
      sizes: sizes.length ? sizes : list[i].sizes,
    };
    atualizados++;
  }

  const err = await saveAll(list);
  if (err) return { atualizados: 0, error: err };
  return { atualizados };
}
