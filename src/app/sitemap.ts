import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/db";
import { SITE } from "@/lib/site";
import { categories } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const produtos = await getAllProducts();
  const agora = new Date();
  const absoluta = (imagem: string) =>
    /^https?:\/\//i.test(imagem) ? imagem : `${SITE.url}${imagem}`;

  const fixas: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/produtos`, lastModified: agora, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/sobre`, lastModified: agora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/trocas`, lastModified: agora, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/privacidade`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
  ];

  // As categorias são as páginas com volume de busca real ('scarpin feminino',
  // 'bota feminina'). Só entram as que têm produto — categoria vazia indexada
  // é página morta.
  const usadas = new Set(produtos.map((p) => p.category));
  const cats: MetadataRoute.Sitemap = categories
    .filter((c) => usadas.has(c.slug))
    .map((c) => ({
      url: `${SITE.url}/produtos?categoria=${c.slug}`,
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

  // As fotos entram no sitemap porque o Google Imagens traz gente procurando calçado.
  const itens: MetadataRoute.Sitemap = produtos.map((p) => ({
    url: `${SITE.url}/produtos/${p.slug}`,
    lastModified: agora,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [absoluta(p.image)],
  }));

  return [...fixas, ...cats, ...itens];
}
