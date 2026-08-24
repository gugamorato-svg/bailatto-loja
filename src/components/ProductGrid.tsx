"use client";

import { useEffect, useState } from "react";
import type { Product, CategorySlug } from "@/lib/products";
import { categories } from "@/lib/products";
import { ProductCard } from "./ProductCard";

type Filtro = CategorySlug | "todos";
type Ordem = "relevancia" | "menor" | "maior";

const CHAVE_NUMERACAO = "bailatto-numeracao";

export function ProductGrid({
  products,
  categoriaInicial,
}: {
  products: Product[];
  /** Vem de ?categoria= lido no servidor: assim a fita do cabeçalho e os links
   *  de campanha do Instagram já caem na categoria certa. */
  categoriaInicial?: string;
}) {
  const inicial: Filtro = categories.some((c) => c.slug === categoriaInicial)
    ? (categoriaInicial as CategorySlug)
    : "todos";

  const [categoria, setCategoria] = useState<Filtro>(inicial);

  useEffect(() => {
    setCategoria(inicial);
  }, [inicial]);

  const [numeracao, setNumeracao] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("relevancia");

  // A numeração fica guardada: quem já disse que calça 38 não deve dizer de novo.
  useEffect(() => {
    const salva = Number(localStorage.getItem(CHAVE_NUMERACAO));
    if (Number.isFinite(salva) && salva > 0) setNumeracao(salva);
  }, []);

  function escolherNumeracao(n: number | null) {
    setNumeracao(n);
    if (n) localStorage.setItem(CHAVE_NUMERACAO, String(n));
    else localStorage.removeItem(CHAVE_NUMERACAO);
  }

  const categoriasPresentes = categories.filter((c) =>
    products.some((p) => p.category === c.slug),
  );

  const numeracoesPresentes = [
    ...new Set(products.flatMap((p) => p.sizes)),
  ].sort((a, b) => a - b);

  let visiveis = products.filter((p) => {
    if (categoria !== "todos" && p.category !== categoria) return false;
    if (numeracao && !p.sizes.includes(numeracao)) return false;
    return true;
  });

  if (ordem !== "relevancia") {
    const preco = (p: Product) => p.price ?? Number.MAX_SAFE_INTEGER;
    visiveis = [...visiveis].sort((a, b) =>
      ordem === "menor" ? preco(a) - preco(b) : preco(b) - preco(a),
    );
  }

  return (
    <div>
      {/* Numeração primeiro: é o filtro que muda o que a cliente consegue comprar. */}
      <div className="mb-6 rounded-[2px] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text">Sua numeração:</span>
          {numeracoesPresentes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => escolherNumeracao(numeracao === n ? null : n)}
              className={
                "h-9 w-9 rounded-full border text-sm transition-colors " +
                (numeracao === n
                  ? "border-wine bg-wine text-on-wine"
                  : "border-border text-text-2 hover:border-wine hover:text-wine")
              }
            >
              {n}
            </button>
          ))}
        </div>
        {numeracao && (
          <p className="mt-3 text-sm text-text-2">
            Mostrando só o que temos no <strong className="text-text">{numeracao}</strong>{" "}
            ·{" "}
            <button
              type="button"
              onClick={() => escolherNumeracao(null)}
              className="text-wine hover:underline"
            >
              limpar
            </button>
          </p>
        )}
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Chip ativo={categoria === "todos"} onClick={() => setCategoria("todos")}>
            Todos
          </Chip>
          {categoriasPresentes.map((c) => (
            <Chip
              key={c.slug}
              ativo={categoria === c.slug}
              onClick={() => setCategoria(c.slug)}
            >
              {c.label}
            </Chip>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-text-2">
          Ordenar:
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="rounded-[2px] border border-border bg-surface px-3 py-1.5 text-text outline-none focus:border-wine"
          >
            <option value="relevancia">Destaques</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </label>
      </div>

      <p className="mb-6 text-sm text-text-2">
        {visiveis.length} {visiveis.length === 1 ? "modelo" : "modelos"}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-[2px] border border-border bg-surface p-10 text-center">
          <p className="text-text">
            Não temos nada no {numeracao} nessa categoria agora.
          </p>
          <p className="mt-2 text-sm text-text-2">
            Tente outra categoria, ou fale com a gente no WhatsApp — às vezes
            conseguimos encomendar o seu número.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visiveis.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-4 py-1.5 text-sm transition-colors " +
        (ativo
          ? "border-wine bg-wine text-on-wine"
          : "border-border text-text-2 hover:border-wine hover:text-wine")
      }
    >
      {children}
    </button>
  );
}
