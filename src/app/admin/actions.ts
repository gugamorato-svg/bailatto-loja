"use server";

import { redirect } from "next/navigation";
import { login, logout, isAdmin } from "@/lib/auth";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadImage,
  adminGetProduct,
  type ProductInput,
} from "@/lib/db";
import { slugify } from "@/lib/slug";
import { updateOrder, type OrderStatus } from "@/lib/orders";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  const ok = await login(password);
  redirect(ok ? "/admin" : "/admin/login?erro=1");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

function parseMoney(raw: FormDataEntryValue | null): number | null {
  const s = String(raw || "").trim().replace(/\./g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function saveProduct(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "scarpins");
  const description = String(formData.get("description") || "").trim();
  const price = parseMoney(formData.get("price"));
  const promoPrice = parseMoney(formData.get("promoPrice"));
  const sizes = formData
    .getAll("sizes")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
  const featured = formData.get("featured") === "on";
  const active = formData.get("active") === "on";

  const back = id ? `/admin/produtos/${id}` : "/admin/produtos/novo";

  if (!name) redirect(`${back}?erro=${encodeURIComponent("Informe o nome do produto.")}`);

  // Imagem: usa a atual, e substitui se enviarem um arquivo novo
  let image = String(formData.get("currentImage") || "");
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const up = await adminUploadImage(file);
    if (up.error) redirect(`${back}?erro=${encodeURIComponent(up.error)}`);
    if (up.url) image = up.url;
  }

  // Galeria: cada campo mantém a foto atual se não houver um novo arquivo.
  const images = [1, 2].map((slot) =>
    String(formData.get(`currentGalleryImage${slot}`) || ""),
  );
  for (let i = 0; i < 2; i++) {
    const galleryFile = formData.get(`galleryImage${i + 1}`);
    if (galleryFile instanceof File && galleryFile.size > 0) {
      const up = await adminUploadImage(galleryFile);
      if (up.error) redirect(`${back}?erro=${encodeURIComponent(up.error)}`);
      if (up.url) images[i] = up.url;
    }
  }

  const input: ProductInput = {
    slug: "",
    name,
    category,
    description,
    price,
    promoPrice,
    sizes: sizes.length ? sizes : [34, 35, 36, 37, 38, 39],
    image,
    images: images.filter(Boolean),
    featured,
    active,
  };

  if (id) {
    const existing = await adminGetProduct(id);
    input.slug = existing?.slug || slugify(name);
    const err = await adminUpdateProduct(id, input);
    if (err) redirect(`${back}?erro=${encodeURIComponent(err)}`);
  } else {
    let slug = slugify(name);
    input.slug = slug;
    let err = await adminCreateProduct(input);
    if (err && /duplicate|unique/i.test(err)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      input.slug = slug;
      err = await adminCreateProduct(input);
    }
    if (err) redirect(`${back}?erro=${encodeURIComponent(err)}`);
  }

  redirect("/admin?ok=1");
}

export async function deleteProductAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") || "");
  if (id) await adminDeleteProduct(id);
  redirect("/admin?deleted=1");
}

export async function updateOrderAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as OrderStatus;
  const tracking = String(formData.get("tracking") || "").trim();
  if (!id) redirect("/admin/pedidos");
  await updateOrder(id, { status, tracking: tracking || undefined });
  redirect(`/admin/pedidos/${id}?ok=1`);
}
