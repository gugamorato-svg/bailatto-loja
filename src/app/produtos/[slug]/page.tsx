import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/db";
import { categoryLabel } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/AddToCart";
import { CalculadoraFrete } from "@/components/CalculadoraFrete";
import { GuiaNumeracao } from "@/components/GuiaNumeracao";
import { FichaTecnica } from "@/components/FichaTecnica";
import { VoceTambemVaiGostar } from "@/components/VoceTambemVaiGostar";
import { SITE, enderecoCompleto } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Descrição única por produto: o preço e a numeração é o que decide o clique na busca. */
function descricaoBusca(p: {
  name: string;
  price: number | null;
  sizes: number[];
  category: string;
}): string {
  const preco = p.price != null ? ` por ${formatPrice(p.price)}` : "";
  const nums = p.sizes.length
    ? ` Numerações ${p.sizes[0]} ao ${p.sizes[p.sizes.length - 1]}.`
    : "";
  return `${p.name}${preco} na BAILATTO Calçados.${nums} Retirada grátis em São Carlos-SP ou entrega para todo o Brasil.`;
}

export async function generateMetadata({
  params,
}: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };

  const descricao = descricaoBusca(product);
  const url = `${SITE.url}/produtos/${product.slug}`;

  return {
    title: product.name,
    description: descricao,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: "website",
      url,
      title: `${product.name} — ${SITE.nome}`,
      description: descricao,
      images: [{ url: product.image, width: 1200, height: 800, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${SITE.nome}`,
      description: descricao,
      images: [product.image],
    },
  };
}

const GARANTIAS = [
  ["🏪", "Loja física em São Carlos", enderecoCompleto],
  ["↩️", "7 dias para troca", "direito de arrependimento garantido por lei"],
  ["💬", "Atendimento pessoal", "tire dúvidas de numeração no WhatsApp"],
];

export default async function ProdutoPage({
  params,
}: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const relacionados = await getAllProducts();

  const emEstoque = product.estoque
    ? Object.values(product.estoque).reduce((s, n) => s + n, 0)
    : null;

  // Dados estruturados: é assim que o Google mostra preço e disponibilidade na busca.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `${SITE.url}${product.image}`,
    category: categoryLabel(product.category),
    brand: { "@type": "Brand", name: "BAILATTO" },
    ...(product.price != null && {
      offers: {
        "@type": "Offer",
        url: `${SITE.url}/produtos/${product.slug}`,
        priceCurrency: "BRL",
        price: product.price,
        availability:
          emEstoque === null || emEstoque > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: SITE.nome },
      },
    }),
  };

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/produtos" className="text-sm text-text-2 hover:text-wine">
        ← Voltar para a coleção
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-surface-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rose">
            {categoryLabel(product.category)}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-text sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl text-wine">{formatPrice(product.price)}</p>

          {emEstoque !== null && emEstoque > 0 && emEstoque <= 3 && (
            <p className="mt-2 text-sm text-wine">
              Últimas {emEstoque} {emEstoque === 1 ? "unidade" : "unidades"} em estoque
            </p>
          )}

          <p className="mt-6 leading-relaxed text-text-2">{product.description}</p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <GuiaNumeracao nomeProduto={product.name} numeracoes={product.sizes} />

          <CalculadoraFrete />

          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            {GARANTIAS.map(([icone, titulo, detalhe]) => (
              <li key={titulo} className="flex gap-3">
                <span aria-hidden>{icone}</span>
                <span>
                  <span className="block text-text">{titulo}</span>
                  <span className="block text-text-2">{detalhe}</span>
                </span>
              </li>
            ))}
          </ul>

          <FichaTecnica product={product} />

          <div className="mt-6 border-t border-border pt-6 text-sm text-text-2">
            <p>
              Dúvidas sobre numeração ou modelos?{" "}
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wine hover:underline"
              >
                Fale conosco no WhatsApp
              </a>
              . Respondemos de segunda a sexta, 9h às 18h, e sábado até 13h.
            </p>
          </div>
        </div>
      </div>

      <VoceTambemVaiGostar atual={product} todos={relacionados} />
    </section>
  );
}
