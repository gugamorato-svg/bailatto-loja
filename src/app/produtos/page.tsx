import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import { ProductGrid } from "@/components/ProductGrid";

export const metadata: Metadata = {
  title: "Nossa Coleção — 125 modelos de calçados femininos",
  description:
    "Scarpins, sandálias, sapatilhas, mocassins, botas, rasteirinhas, papetes e tamancos. Veja preço e numeração disponível, com retirada grátis em São Carlos-SP ou entrega para todo o Brasil.",
  alternates: { canonical: "/produtos" },
};

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: PageProps<"/produtos">) {
  const products = await getAllProducts();
  const { categoria } = await searchParams;
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-14">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-text">Nossa Coleção</h1>
        <p className="mt-2 text-text-2">
          {products.length} modelos selecionados para você
        </p>
      </div>
      <ProductGrid
        products={products}
        categoriaInicial={typeof categoria === "string" ? categoria : undefined}
      />
    </section>
  );
}
