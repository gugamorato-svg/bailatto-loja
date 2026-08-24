"use server";

import { redirect } from "next/navigation";
import { getAllProducts } from "@/lib/db";
import { cotarFrete } from "@/lib/frete";
import {
  createOrder,
  DELIVERY_PRICE,
  type DeliveryMethod,
  type OrderItem,
} from "@/lib/orders";

type CartLine = { slug: string; size: number; qty: number };

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

export async function submitOrder(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const cpf = String(formData.get("cpf") || "").trim();
  const method = String(formData.get("delivery") || "retirada") as DeliveryMethod;

  const fail = (msg: string) =>
    redirect(`/checkout?erro=${encodeURIComponent(msg)}`);

  if (!name) fail("Informe seu nome completo.");
  if (digits(phone).length < 10) fail("Informe um WhatsApp válido com DDD.");
  if (DELIVERY_PRICE[method] === undefined) fail("Escolha a forma de entrega.");

  // Itens vêm do carrinho (navegador). Recalculamos os preços no servidor.
  let lines: CartLine[] = [];
  try {
    lines = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    fail("Não conseguimos ler sua sacola.");
  }
  if (!Array.isArray(lines) || lines.length === 0) fail("Sua sacola está vazia.");

  const products = await getAllProducts();
  const items: OrderItem[] = [];
  for (const l of lines) {
    const p = products.find((x) => x.slug === l.slug);
    if (!p) continue;
    const qty = Math.max(1, Math.min(20, Number(l.qty) || 1));
    items.push({
      slug: p.slug,
      name: p.name,
      size: Number(l.size),
      qty,
      price: p.price,
      image: p.image,
    });
  }
  if (items.length === 0) fail("Não encontramos os produtos da sua sacola.");

  const allPriced = items.every((i) => i.price != null);
  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);

  const delivery: Record<string, string> = { method };
  let shipping: number | null = DELIVERY_PRICE[method];

  if (method !== "retirada") {
    for (const f of ["cep", "street", "number", "complement", "district", "city", "uf"]) {
      const v = String(formData.get(f) || "").trim();
      if (v) delivery[f] = v;
    }
    if (!delivery.street || !delivery.number || !delivery.city) {
      fail("Preencha o endereço de entrega.");
    }
  }

  // Envio para outra cidade: recotamos aqui para não confiar no preço do navegador.
  if (method === "correios") {
    const escolhido = String(formData.get("servicoFrete") || "").trim();
    if (!escolhido) fail("Escolha uma opção de envio.");

    const pares = items.reduce((s, i) => s + i.qty, 0);
    const { opcoes, erro } = await cotarFrete(delivery.cep ?? "", pares);
    if (erro || opcoes.length === 0) {
      fail(erro || "Não consegui calcular o frete. Tente de novo.");
    }
    const opcao = opcoes.find((o) => o.id === escolhido);
    if (!opcao) fail("Essa opção de envio não está mais disponível. Escolha outra.");
    shipping = opcao!.preco;
    delivery.transportadora = opcao!.nome;
  }

  const total = allPriced && shipping != null ? subtotal + shipping : null;

  const { id, error } = await createOrder({
    customer: { name, phone, email, cpf },
    delivery: delivery as never,
    items,
    subtotal,
    shipping,
    total,
  });

  if (error || !id) fail(error || "Não foi possível criar o pedido.");
  redirect(`/pedido/${id}`);
}
