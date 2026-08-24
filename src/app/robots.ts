import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel e o checkout não têm nada a indexar.
      disallow: ["/admin", "/admin/", "/checkout", "/carrinho", "/pedido/", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
