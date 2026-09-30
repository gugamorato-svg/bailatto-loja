"use client";

import { useEffect, useRef, useState } from "react";
import { type Product, TAMANHO_UNICO } from "@/lib/products";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { adicionarAoCarrinho } from "@/lib/eventos";
import { IconeConfirmado } from "./icones";

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
  const folhaRef = useRef<HTMLDivElement>(null);

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

  // Avisa o botão flutuante do WhatsApp para subir enquanto a barra de compra
  // ocupa o rodapé — senão ele fica por cima do "Adicionar".
  useEffect(() => {
    if (botaoVisivel) delete document.body.dataset.barraCompra;
    else document.body.dataset.barraCompra = "1";
    return () => {
      delete document.body.dataset.barraCompra;
    };
  }, [botaoVisivel]);

  // Sair pelo Esc é o que qualquer pessoa tenta primeiro; sem isso a folha de
  // numeração só fecha com o toque exato fora dela.
  useEffect(() => {
    if (!abrirNumeracao) return;
    folhaRef.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAbrirNumeracao(false);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [abrirNumeracao]);

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

  /** O rótulo do botão troca de estado; o ícone confirma sem depender da leitura. */
  const rotulo = (curto = false) => (
    <>
      {added && <IconeConfirmado tamanho={17} />}
      {added ? (curto ? "Na sacola" : "Adicionado à sacola") : curto ? "Adicionar" : "Adicionar à sacola"}
    </>
  );

  const esgotado = (
    <div className="rounded-xs border border-border bg-surface p-4 text-sm text-text-2">
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

  /** Barra fixa de compra do celular. Fica sempre montada e desliza para fora:
   *  desmontar cortava a saída pela metade e ela piscava a cada rolagem. */
  const barraFixa = (aoTocar: () => void, textoBotao: React.ReactNode) => (
    <div
      inert={botaoVisivel}
      aria-hidden={botaoVisivel}
      className={
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-[380ms] ease-[var(--ease-saida)] md:hidden " +
        (botaoVisivel ? "translate-y-full" : "translate-y-0")
      }
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-text-2">{product.name}</p>
          <p className="text-lg leading-tight text-wine">
            {formatPrice(product.price)}
          </p>
        </div>
        <button
          type="button"
          onClick={aoTocar}
          className="btn btn-principal shrink-0 px-5"
        >
          {textoBotao}
        </button>
      </div>
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
          className="btn btn-principal w-full sm:w-auto"
        >
          {rotulo()}
        </button>
        {barraFixa(() => adicionar(TAMANHO_UNICO), rotulo(true))}
      </div>
    );
  }

  if (product.sizes.length === 0 && !product.tamanhoUnico) return esgotado;

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-text">Numeração</div>
      <div className="flex flex-wrap gap-2.5">
        {/* Alvo de toque de 48px: abaixo de 44px a cliente erra a numeração e
            isso volta como troca. */}
        {product.sizes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={size === s}
            onClick={() => {
              setSize(s);
              setError(false);
            }}
            className="ficha h-12 w-12 px-0 text-sm"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Escassez verdadeira: sai do estoque real do Phibo, nunca de um número inventado. */}
      <p aria-live="polite" className="empty:hidden">
        {escolhida === 1 && (
          <span className="mt-2 block text-sm text-wine">Última no {size}</span>
        )}
        {escolhida !== null && escolhida > 1 && escolhida <= 3 && (
          <span className="mt-2 block text-sm text-text-2">
            Restam {escolhida} pares no {size}
          </span>
        )}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-wine">
          Selecione a numeração.
        </p>
      )}

      <button
        ref={botaoRef}
        type="button"
        onClick={() => adicionar(size)}
        className="btn btn-principal mt-6 w-full sm:w-auto"
      >
        {rotulo()}
      </button>

      {barraFixa(
        () => {
          if (size == null) setAbrirNumeracao(true);
          else adicionar(size);
        },
        added ? rotulo(true) : size == null ? "Escolher nº" : "Adicionar",
      )}

      {/* ---- Seletor de numeração em bottom-sheet ----
          Também fica montado: a folha precisa sair deslizando para baixo, na
          mesma direção em que entrou. */}
      <div
        inert={!abrirNumeracao}
        className={
          "fixed inset-0 z-50 flex items-end bg-black/40 transition-opacity duration-[380ms] ease-[var(--ease-saida)] md:hidden " +
          (abrirNumeracao ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={() => setAbrirNumeracao(false)}
      >
        <div
          ref={folhaRef}
          role="dialog"
          aria-modal="true"
          aria-label="Escolha a numeração"
          tabIndex={-1}
          className={
            "w-full rounded-t-xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none transition-transform duration-[380ms] ease-[var(--ease-saida)] " +
            (abrirNumeracao ? "translate-y-0" : "translate-y-full")
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <p className="mb-3 text-sm font-medium text-text">Escolha a numeração</p>
          <div className="flex flex-wrap gap-2.5">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s);
                  setError(false);
                  setAbrirNumeracao(false);
                  adicionar(s);
                }}
                className="ficha h-12 w-12 px-0 text-sm"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAbrirNumeracao(false)}
            className="mt-5 w-full py-3 text-sm text-text-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
