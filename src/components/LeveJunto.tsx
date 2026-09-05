import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

/**
 * As 151 páginas de calçado concentram todo o tráfego do site, e o
 * "Você também vai gostar" só mostra a mesma categoria — ou seja, elas davam
 * zero impressão para as semijoias e acessórios.
 *
 * Este bloco é COMPLEMENTO, não substituição: o outro serve para quem não
 * gostou daquele modelo; este serve para somar ao que a cliente já quer.
 * Só aparece na página de calçado, e só com item barato — a graça é ser um
 * "leva também" de impulso, não uma segunda decisão de compra.
 */
const TETO = 40;

export function LeveJunto({ atual, todos }: { atual: Product; todos: Product[] }) {
  // Na página de uma semijoia isso viraria mais do mesmo.
  if (atual.tamanhoUnico) return null;

  const emEstoque = (p: Product) =>
    !p.estoque || Object.values(p.estoque).reduce((s, n) => s + n, 0) > 0;

  const candidatos = todos
    .filter(
      (p) =>
        p.tamanhoUnico &&
        p.slug !== atual.slug &&
        p.price != null &&
        p.price <= TETO &&
        emEstoque(p),
    )
    // Varia por produto para a vitrine não ficar sempre igual, mas de forma
    // estável: o mesmo calçado mostra sempre os mesmos acessórios.
    .sort((a, b) => {
      const chave = (p: Product) => (p.slug + atual.slug).length % 7;
      return chave(a) - chave(b) || a.slug.localeCompare(b.slug);
    })
    .slice(0, 4);

  if (candidatos.length < 2) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="mb-2 font-serif text-2xl text-text">
        Leve <span className="italic text-wine">junto</span>
      </h2>
      <p className="mb-8 text-sm text-text-2">
        Peças únicas a partir de R$ 15 — vão na mesma entrega, sem frete a mais.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {candidatos.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
