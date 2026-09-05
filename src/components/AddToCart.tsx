"use client";

import { useEffect, useRef, useState } from "react";
import { type Product, TAMANHO_UNICO } from "@/lib/products";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { adicionarAoCarrinho } from "@/lib/eventos";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);
  // Barra fixa só aparece quando o botão de verdade sai da tela — no celular a
  // descrição e o frete empurram ele para muito abaixo da dobra.
  const [botaoVisivel, setBotaoVisivel] = useState(true);
  const [abrirNumeracao, setAbrirNumeracao] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);

  // Scroll em vez de IntersectionObserver: o IO depende do compositor e não
  // dispara em alguns navegadores embutidos (o do Instagram é justamente de
  // onde vem a maior parte do tráfego). Um listener passivo é barato e certo.
  useEffect(() => {
    function conferir() {
      const alvo = botaoRef.current;
      if (!alvo) return;
      const r = alvo.getBoundingClientRect();
      // Some quando o botão sai por cima ou ainda está abaixo da dobra.
      setBotaoVisivel(r.bottom > 0 && r.top < window.innerHeight - 80);
    }
    conferir();
    window.addEventListener("scroll", conferir, { passive: true });
    window.addEventListener("resize", conferir);
    return () => {
      window.removeEventListener("scroll", conferir);
      window.removeEventListener("resize", conferir);
    };
  }, []);

  const paresDaNumeracao = (n: number) => product.estoque?.[String(n)] ?? null;
  const escolhida = size != null ? paresDaNumeracao(size) : null;

  function adicionar(n: number | null) {
    if (n == null) {
      setError(true);
      return;
    }
    add({
      slug: product.slug,
      name: product.name,
      image: product.image,
      size: n,
      price: product.price,
    });
    adicionarAoCarrinho(product);
    setError(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  const esgotado = (
    <div className="rounded-[2px] border border-border bg-surface p-4 text-sm text-text-2">
      Esgotado no momento —{" "}
      <a
        href={`https://wa.me/${SITE.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-wine hover:underline"
      >
        consulte pelo WhatsApp
      </a>
      .
    </div>
  );

  // Semijoias e acessorios nao tem numeracao: vao direto para a sacola.
  // Precisa vir ANTES do bloco de esgotado, que olha so para sizes.length.
  if (product.tamanhoUnico) {
    const unidades = product.estoque
      ? Object.values(product.estoque).reduce((s, n) => s + n, 0)
      : null;
    if (unidades === 0) return esgotado;
    return (
      <div>
        <p className="mb-4 text-sm text-text-2">Tamanho único</p>
        <button
          ref={botaoRef}
          type="button"
          onClick={() => adicionar(TAMANHO_UNICO)}
          className="w-full rounded-[2px] bg-wine px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-on-wine transition-colors hover:bg-wine-2 sm:w-auto"
        >
          {added ? "Adicionado à sacola ✓" : "Adicionar à sacola"}
        </button>
        {!botaoVisivel && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-text-2">{product.name}</p>
                <p className="text-lg leading-tight text-wine">
                  {formatPrice(product.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => adicionar(TAMANHO_UNICO)}
                className="shrink-0 rounded-[2px] bg-wine px-5 py-3 text-sm font-medium uppercase tracking-wide text-on-wine"
              >
                {added ? "Na sacola ✓" : "Adicionar"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (product.sizes.length === 0 && !product.tamanhoUnico) return esgotado;


  /** Alvo de toque de 48px: abaixo de 44px a cliente erra a numeração e vira troca. */
  const botaoNumeracao = (s: number, selecionada: boolean) =>
    "h-12 w-12 rounded-[2px] border text-sm transition-colors " +
    (selecionada
      ? "border-wine bg-wine text-on-wine"
      : "border-border text-text hover:border-wine");

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-text">Numeração</div>
      <div className="flex flex-wrap gap-2.5">
        {product.sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSize(s);
              setError(false);
            }}
            className={botaoNumeracao(s, size === s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Escassez verdadeira: sai do estoque real do Phibo, nunca de um número inventado. */}
      {escolhida === 1 && (
        <p className="mt-2 text-sm text-wine">Última no {size} ✦</p>
      )}
      {escolhida !== null && escolhida > 1 && escolhida <= 3 && (
        <p className="mt-2 text-sm text-text-2">
          Restam {escolhida} pares no {size}
        </p>
      )}

      {error && <p className="mt-2 text-sm text-wine">Selecione a numeração.</p>}

      <button
        ref={botaoRef}
        type="button"
        onClick={() => adicionar(size)}
        className="mt-6 w-full rounded-[2px] bg-wine px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-on-wine transition-colors hover:bg-wine-2 sm:w-auto"
      >
        {added ? "Adicionado à sacola ✓" : "Adicionar à sacola"}
      </button>

      {/* ---- Barra fixa de compra (só celular) ---- */}
      {!botaoVisivel && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-text-2">{product.name}</p>
              <p className="text-lg leading-tight text-wine">
                {formatPrice(product.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (size == null) setAbrirNumeracao(true);
                else adicionar(size);
              }}
              className="shrink-0 rounded-[2px] bg-wine px-5 py-3 text-sm font-medium uppercase tracking-wide text-on-wine"
            >
              {added ? "Na sacola ✓" : size == null ? "Escolher nº" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      {/* ---- Seletor de numeração em bottom-sheet ---- */}
      {abrirNumeracao && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 md:hidden"
          onClick={() => setAbrirNumeracao(false)}
        >
          <div
            className="w-full rounded-t-xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p className="mb-3 text-sm font-medium text-text">
              Escolha a numeração
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setError(false);
                    setAbrirNumeracao(false);
                    adicionar(s);
                  }}
                  className={botaoNumeracao(s, size === s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAbrirNumeracao(false)}
              className="mt-5 w-full py-2 text-sm text-text-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
