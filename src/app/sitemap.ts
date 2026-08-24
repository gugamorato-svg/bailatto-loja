import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const produtos = await getAllProducts();
  const agora = new Date();

  const fixas: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/produtos`, lastModified: agora, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/sobre`, lastModified: agora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/trocas`, lastModified: agora, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/privacidade`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
  ];

  // As fotos entram no sitemap porque o Google Imagens traz gente procurando calçado.
  const itens: MetadataRoute.Sitemap = produtos.map((p) => ({
    url: `${SITE.url}/produtos/${p.slug}`,
    lastModified: agora,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [`${SITE.url}${p.image}`],
  }));

  return [...fixas, ...itens];
}
