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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-[2px] text-text md:hidden"
        >
          <span className="text-xl">☰</span>
        </button>

        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-serif text-2xl tracking-[0.25em] text-text md:text-3xl"
        >
          BAILATTO
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm uppercase tracking-wide text-text-2 transition-colors hover:text-wine"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-wide text-text-2 transition-colors hover:text-wine"
          >
            Instagram
          </a>
        </nav>

        <Link
          href="/carrinho"
          className="relative flex items-center gap-2 text-sm uppercase tracking-wide text-text-2 transition-colors hover:text-wine"
        >
          <span>Sacola</span>
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wine px-1 text-xs text-on-wine">
              {count}
            </span>
          )}
        </Link>
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
