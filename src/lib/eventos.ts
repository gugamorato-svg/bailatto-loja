"use client";

/**
 * Eventos de navegação (navegador). O Purchase NÃO está aqui de propósito:
 * ver o comentário em Rastreamento.tsx.
 *
 * Tudo é best-effort: se o bloqueador de anúncio derrubar o fbq, a loja
 * continua funcionando normalmente.
 */
type Params = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function meta(evento: string, params?: Params) {
  try {
    window.fbq?.("track", evento, params);
  } catch {
    /* rastreamento nunca pode quebrar a loja */
  }
}

function google(evento: string, params?: Params) {
  try {
    window.gtag?.("event", evento, params);
  } catch {
    /* idem */
  }
}

export function verProduto(p: { slug: string; name: string; price: number | null }) {
  const valor = p.price ?? 0;
  meta("ViewContent", {
    content_ids: [p.slug],
    content_name: p.name,
    content_type: "product",
    value: valor,
    currency: "BRL",
  });
  google("view_item", {
    currency: "BRL",
    value: valor,
    items: [{ item_id: p.slug, item_name: p.name, price: valor }],
  });
}

export function adicionarAoCarrinho(p: {
  slug: string;
  name: string;
  price: number | null;
}) {
  const valor = p.price ?? 0;
  meta("AddToCart", {
    content_ids: [p.slug],
    content_name: p.name,
    content_type: "product",
    value: valor,
    currency: "BRL",
  });
  google("add_to_cart", {
    currency: "BRL",
    value: valor,
    items: [{ item_id: p.slug, item_name: p.name, price: valor }],
  });
}

export function iniciarCheckout(itens: { slug: string; qty: number; price: number | null }[]) {
  const valor = itens.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);
  meta("InitiateCheckout", {
    content_ids: itens.map((i) => i.slug),
    content_type: "product",
    num_items: itens.reduce((s, i) => s + i.qty, 0),
    value: valor,
    currency: "BRL",
  });
  google("begin_checkout", {
    currency: "BRL",
    value: valor,
    items: itens.map((i) => ({ item_id: i.slug, quantity: i.qty, price: i.price ?? 0 })),
  });
}

/**
 * Pedido feito — ainda NÃO é compra. Serve para medir o funil; a conversão
 * de verdade é enviada pelo servidor quando o Pix é confirmado.
 */
export function pedidoFeito(valor: number) {
  google("generate_lead", { currency: "BRL", value: valor });
}
