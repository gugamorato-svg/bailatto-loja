"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { categories } from "@/lib/products";
import { IconeFechar, IconeMenu } from "./icones";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/sobre", label: "A loja" },
];

const INSTAGRAM = "https://instagram.com/bailatto.calcados.saocarlos";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      {/* Wordmark centralizado com nav dividida, no padrão editorial das grandes
          marcas. No celular vira [hambúrguer · wordmark · sacola]. */}
      <div className="mx-auto grid max-w-[1240px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-5 md:grid-cols-3">
        <div className="flex items-center md:justify-self-start">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-celular"
            className="-ml-2 flex h-11 w-11 items-center justify-center text-text transition-transform duration-150 ease-[var(--ease-saida)] active:scale-90 md:hidden"
          >
            {open ? <IconeFechar tamanho={22} /> : <IconeMenu tamanho={22} />}
          </button>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-[0.72rem] uppercase tracking-[0.16em] text-text/75 transition-colors duration-200 hover:text-wine"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="justify-self-start pl-[0.35em] font-serif text-xl tracking-[0.35em] text-text md:justify-self-center md:text-2xl md:tracking-[0.42em]"
        >
          BAILATTO
        </Link>

        <div className="flex items-center justify-end gap-6 md:justify-self-end">
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-[0.72rem] uppercase tracking-[0.16em] text-text/75 transition-colors duration-200 hover:text-wine md:inline"
          >
            Instagram
          </a>
          <Link
            href="/carrinho"
            className="relative flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-text/75 transition-colors duration-200 hover:text-wine"
          >
            <span>Sacola</span>
            {count > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[0.6rem] text-on-wine">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Fita de categorias no celular: quem chega do Instagram cai na home ou
          num produto e não descobre que existem 10 categorias escondidas no
          menu. É o mesmo padrão de chips que ela já usa na Shein. */}
      <div className="border-t border-border md:hidden">
        <div className="flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/produtos"
            onClick={() => setOpen(false)}
            className="ficha shrink-0 snap-start text-xs uppercase tracking-wide"
          >
            Tudo
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/produtos?categoria=${c.slug}`}
              onClick={() => setOpen(false)}
              className="ficha shrink-0 snap-start text-xs uppercase tracking-wide"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Fica montado e abre por transição de altura: desmontar corta a saída
          pela metade, e o menu aparecia e sumia num estalo. */}
      <div
        id="menu-celular"
        inert={!open}
        data-aberto={open}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-[var(--ease-saida)] data-[aberto=true]:grid-rows-[1fr] md:hidden"
      >
        <nav className="overflow-hidden border-t border-border bg-surface">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm uppercase tracking-wide text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm uppercase tracking-wide text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text"
          >
            Instagram
          </a>
        </nav>
      </div>
    </header>
  );
}
