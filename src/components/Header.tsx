"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { categories } from "@/lib/products";

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
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center text-text md:hidden"
          >
            <span className="text-xl">☰</span>
          </button>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-[0.72rem] uppercase tracking-[0.16em] text-text/75 transition-colors hover:text-wine"
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
            className="hidden text-[0.72rem] uppercase tracking-[0.16em] text-text/75 transition-colors hover:text-wine md:inline"
          >
            Instagram
          </a>
          <Link
            href="/carrinho"
            className="relative flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-text/75 transition-colors hover:text-wine"
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
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/produtos"
            onClick={() => setOpen(false)}
            className="shrink-0 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-xs uppercase tracking-wide text-text-2"
          >
            Tudo
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/produtos?categoria=${c.slug}`}
              onClick={() => setOpen(false)}
              className="shrink-0 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-xs uppercase tracking-wide text-text-2"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-surface md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm uppercase tracking-wide text-text-2 hover:bg-surface-2"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 text-sm uppercase tracking-wide text-text-2 hover:bg-surface-2"
          >
            Instagram
          </a>
        </nav>
      )}
    </header>
  );
}
