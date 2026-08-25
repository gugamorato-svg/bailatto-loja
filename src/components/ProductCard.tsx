import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
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
      {/* Retrato 4:5, no padrão das grandes marcas — as fotos foram refeitas
          em retrato pela IA, então enquadram certinho sem cortar. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1180px) 33vw, 280px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {ultimasPecas && (
          <span className="absolute left-3 top-3 bg-bg/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-text backdrop-blur-sm">
            Últimas peças
          </span>
        )}
      </div>
      <div className="mt-3.5 flex flex-col gap-1.5">
        <h3 className="text-[0.78rem] uppercase leading-snug tracking-[0.09em] text-text transition-colors group-hover:text-wine">
          {product.name}
        </h3>
        <p className="font-serif text-[0.95rem] text-text-2">
          {formatPrice(product.price)}
        </p>
        {/* A numeração disponível é o que decide o clique numa rolagem longa. */}
        {product.sizes.length > 0 && (
          <p className="text-[0.7rem] tracking-wide text-text-2/80">
            {product.sizes.join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
