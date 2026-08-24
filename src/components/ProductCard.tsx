import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
import { categoryLabel } from "@/lib/products";
import { formatPrice } from "@/lib/format";

/** Total de pares em estoque (null quando o produto não tem controle). */
export function paresEmEstoque(p: Product): number | null {
  if (!p.estoque) return null;
  return Object.values(p.estoque).reduce((s, n) => s + n, 0);
}

export function ProductCard({ product }: { product: Product }) {
  const pares = paresEmEstoque(product);
  const ultimasPecas = pares !== null && pares > 0 && pares <= 2;

  return (
    <Link href={`/produtos/${product.slug}`} className="group block">
      <div className="relative aspect-[3/2] overflow-hidden rounded-[2px] bg-surface-2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1180px) 33vw, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {ultimasPecas && (
          <span className="absolute left-2 top-2 rounded-[2px] bg-wine px-2 py-1 text-[10px] uppercase tracking-wide text-on-wine">
            Últimas peças
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-[0.15em] text-text-2">
          {categoryLabel(product.category)}
        </p>
        <h3 className="mt-1 font-serif text-base leading-snug text-text sm:text-lg">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-wine">{formatPrice(product.price)}</p>
        {/* A numeração disponível é o que decide o clique numa rolagem de 125 produtos. */}
        {product.sizes.length > 0 && (
          <p className="mt-1 text-xs text-text-2">
            {product.sizes.join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
