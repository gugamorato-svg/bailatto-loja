import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

/**
 * Sem sugestão nenhuma, "não gostei desse" vira fim de sessão. Prioriza a mesma
 * categoria e a faixa de preço mais próxima — quem olhou um scarpin de R$ 139
 * dificilmente quer uma rasteira de R$ 79.
 */
export function VoceTambemVaiGostar({
  atual,
  todos,
}: {
  atual: Product;
  todos: Product[];
}) {
  const referencia = atual.price ?? 0;

  const candidatos = todos
    .filter((p) => p.slug !== atual.slug)
    .map((p) => {
      const mesmaCategoria = p.category === atual.category ? 0 : 1000;
      const distanciaPreco = Math.abs((p.price ?? 0) - referencia);
      return { p, peso: mesmaCategoria + distanciaPreco };
    })
    .sort((a, b) => a.peso - b.peso)
    .slice(0, 4)
    .map((x) => x.p);

  if (candidatos.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="mb-8 font-serif text-2xl text-text">
        Você também vai <span className="italic text-wine">gostar</span>
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {candidatos.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
