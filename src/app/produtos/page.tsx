import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import { ProductGrid } from "@/components/ProductGrid";
import { categoriaDaUrl, textoDaCategoria } from "@/lib/categoriasSeo";

/**
 * Cada categoria precisa de title, description e canonical PRÓPRIOS. Antes o
 * metadata era estático e as 13 URLs de ?categoria=... canonicalizavam todas
 * para /produtos — o site pedia ao Google que ignorasse as categorias, que são
 * justamente as páginas com volume de busca de verdade.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/produtos">): Promise<Metadata> {
  const { categoria } = await searchParams;
  const slug = categoriaDaUrl(categoria);
  const t = textoDaCategoria(slug);
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: slug ? `/produtos?categoria=${slug}` : "/produtos" },
    openGraph: { title: t.title, description: t.description, type: "website" },
  };
}

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: PageProps<"/produtos">) {
  const products = await getAllProducts();
  const { categoria } = await searchParams;
  const slug = categoriaDaUrl(categoria);
  const t = textoDaCategoria(slug);
  const quantos = slug
    ? products.filter((p) => p.category === slug).length
    : products.length;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-14">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-text">{t.h1}</h1>
        <p className="mt-2 text-text-2">
          {quantos} {quantos === 1 ? "modelo selecionado" : "modelos selecionados"} para você
        </p>
        {t.intro && (
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-text-2">
            {t.intro}
          </p>
        )}
      </div>
      <ProductGrid
        products={products}
        categoriaInicial={typeof categoria === "string" ? categoria : undefined}
      />
    </section>
  );
}
