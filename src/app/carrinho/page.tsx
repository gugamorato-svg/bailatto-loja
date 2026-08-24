"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

const WHATSAPP = "5516993392022";

export default function CarrinhoPage() {
  const { items, remove, setQty, clear, count } = useCart();

  if (count === 0) {
    return (
      <section className="mx-auto max-w-[1180px] px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-text">
          Sua sacola está vazia
        </h1>
        <p className="mt-3 text-text-2">
          Que tal descobrir o seu próximo par favorito?
        </p>
        <Link
          href="/produtos"
          className="mt-8 inline-block rounded-[2px] bg-wine px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          Ver coleção
        </Link>
      </section>
    );
  }

  const allPriced = items.every((i) => i.price != null);
  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);

  const linhas = items
    .map(
      (i) =>
        `• ${i.name} — Nº ${i.size} — Qtd ${i.qty}\n  https://bailatto.com.br/produtos/${i.slug}`,
    )
    .join("\n");

  const msg = encodeURIComponent(
    "Olá! Gostaria de finalizar meu pedido na BAILATTO:\n\n" +
      linhas +
      "\n\nPode me ajudar?",
  );
  const waUrl = `https://wa.me/${WHATSAPP}?text=${msg}`;

  // A sacola vive no localStorage, e o navegador de dentro do Instagram tem
  // armazenamento isolado: ela monta a sacola lá, abre no Chrome e sumiu.
  // Mandar a lista com os links para si mesma é a saída barata.
  const salvarUrl = `https://wa.me/?text=${encodeURIComponent(
    "Minha sacola na BAILATTO:\n\n" + linhas,
  )}`;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl text-text">Sua sacola</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <ul className="divide-y divide-border lg:col-span-2">
          {items.map((i) => (
            <li key={`${i.slug}-${i.size}`} className="flex gap-4 py-5">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[2px] bg-surface-2">
                <Image
                  src={i.image}
                  alt={i.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <h3 className="font-serif text-lg text-text">{i.name}</h3>
                <p className="text-sm text-text-2">Numeração {i.size}</p>
                <p className="text-sm text-wine">{formatPrice(i.price)}</p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center rounded-[2px] border border-border">
                    {/* 44px é o mínimo confortável para o polegar no celular. */}
                    <button
                      onClick={() => setQty(i.slug, i.size, i.qty - 1)}
                      className="h-11 w-11 text-lg text-text-2 hover:text-wine"
                      aria-label="Diminuir"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
                    <button
                      onClick={() => setQty(i.slug, i.size, i.qty + 1)}
                      className="h-11 w-11 text-lg text-text-2 hover:text-wine"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(i.slug, i.size)}
                    className="text-sm text-text-2 hover:text-wine"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-[2px] border border-border bg-surface p-6">
          <h2 className="font-serif text-xl text-text">Resumo</h2>
          <div className="mt-4 flex justify-between text-sm text-text-2">
            <span>Itens</span>
            <span>{count}</span>
          </div>
          <div className="mt-2 flex justify-between text-text">
            <span>Subtotal</span>
            <span>{allPriced ? formatPrice(subtotal) : "a combinar"}</span>
          </div>
          {!allPriced && (
            <p className="mt-2 text-xs text-text-2">
              Alguns preços serão confirmados no atendimento.
            </p>
          )}

          <Link
            href="/checkout"
            className="mt-6 block rounded-[2px] bg-wine px-6 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
          >
            Finalizar compra
          </Link>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-center text-sm text-text-2 underline decoration-border underline-offset-4 hover:text-wine"
          >
            Dúvida antes de fechar? Chamar no WhatsApp
          </a>
          <a
            href={salvarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-sm text-text-2 underline decoration-border underline-offset-4 hover:text-wine"
          >
            Guardar minha sacola no WhatsApp
          </a>
          <button
            onClick={clear}
            className="mt-4 w-full text-center text-xs text-text-2 hover:text-wine"
          >
            Esvaziar sacola
          </button>
        </div>
      </div>
    </section>
  );
}
