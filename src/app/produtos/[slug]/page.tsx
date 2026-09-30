import type { Metadata } from "next";
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
import { LeveJunto } from "@/components/LeveJunto";
import { VerProduto } from "@/components/VerProduto";
import { ProductGallery } from "@/components/ProductGallery";
import {
  IconeConversa,
  IconeLoja,
  IconeSetaVolta,
  IconeTroca,
} from "@/components/icones";
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
      images: [{
        url: product.image,
        width: 1200,
        height: 1500,
        alt: product.name,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${SITE.nome}`,
      description: descricao,
      images: [product.image],
    },
  };
}

const garantias = (tamanhoUnico?: boolean) => [
  {
    Icone: IconeLoja,
    titulo: "Loja física em São Carlos",
    detalhe: enderecoCompleto,
  },
  {
    Icone: IconeTroca,
    titulo: "7 dias para troca",
    detalhe: "direito de arrependimento garantido por lei",
  },
  {
    Icone: IconeConversa,
    titulo: "Atendimento pessoal",
    detalhe: tamanhoUnico
      ? "tire suas dúvidas no WhatsApp"
      : "tire dúvidas de numeração no WhatsApp",
  },
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
  const imagemAbsoluta = (imagem: string) =>
    /^https?:\/\//i.test(imagem) ? imagem : `${SITE.url}${imagem}`;
  const fotosProduto = [...new Set([product.image, ...(product.images ?? [])])].map(
    imagemAbsoluta,
  );

  // Dados estruturados: é assim que o Google mostra preço e disponibilidade na busca.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: fotosProduto,
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <VerProduto slug={product.slug} name={product.name} price={product.price} />

      {/* Era uma seta de teclado ("← Voltar") e, logo acima do título, a
          categoria escrita em rosa — 2,3:1 de contraste, ilegível. Virou uma
          trilha: diz onde a cliente está e leva de volta à categoria certa. */}
      <nav aria-label="Trilha de navegação" className="flex items-center gap-2 text-sm">
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 text-text-2 transition-colors duration-200 hover:text-wine"
        >
          <IconeSetaVolta tamanho={16} />
          Coleção
        </Link>
        <span aria-hidden className="text-border">/</span>
        <Link
          href={`/produtos?categoria=${product.category}`}
          className="text-text-2 transition-colors duration-200 hover:text-wine"
        >
          {categoryLabel(product.category)}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductGallery
          name={product.name}
          image={product.image}
          images={product.images}
        />

        <div>
          <h1 className="font-serif text-3xl leading-tight text-text sm:text-4xl">
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

          {!product.tamanhoUnico && (
            <GuiaNumeracao nomeProduto={product.name} numeracoes={product.sizes} />
          )}

          <CalculadoraFrete />

          <ul className="mt-8 space-y-3.5 border-t border-border pt-6 text-sm">
            {garantias(product.tamanhoUnico).map((g) => (
              <li key={g.titulo} className="flex gap-3">
                <g.Icone tamanho={18} className="mt-0.5 shrink-0 text-wine" />
                <span>
                  <span className="block text-text">{g.titulo}</span>
                  <span className="block text-text-2">{g.detalhe}</span>
                </span>
              </li>
            ))}
          </ul>

          <FichaTecnica product={product} />

          <div className="mt-6 border-t border-border pt-6 text-sm text-text-2">
            <p>
              {product.tamanhoUnico ? "Quer ver mais de perto?" : "Dúvidas sobre numeração ou modelos?"}{" "}
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

      <LeveJunto atual={product} todos={relacionados} />

      <VoceTambemVaiGostar atual={product} todos={relacionados} />
    </section>
  );
}
