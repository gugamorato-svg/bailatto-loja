"use server";

import { redirect } from "next/navigation";
import { getAllProducts } from "@/lib/db";
import { cotarFrete } from "@/lib/frete";
import { pesoMiudo, ehVolumoso } from "@/lib/products";
import { limiarDaUf } from "@/lib/freteGratis";
import {
  createOrder,
  getOrder,
  updateOrder,
  DELIVERY_PRICE,
  type DeliveryMethod,
  type OrderItem,
} from "@/lib/orders";
import { criarPreferencia, mercadoPagoAtivo } from "@/lib/mercadoPago";

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

    // Mesma separação do navegador: só calçado conta como par. Contar um
    // brinco como caixa de sapato faria o servidor cobrar um frete que a
    // cliente nunca viu na tela.
    const semNumeracao = (i: OrderItem) =>
      products.find((p) => p.slug === i.slug)?.tamanhoUnico === true;
    const pares = items.filter((i) => !semNumeracao(i)).reduce((s, i) => s + i.qty, 0);
    const miudos = items.filter(semNumeracao);
    const pesoMiudos = miudos.reduce((s, i) => s + pesoMiudo(i.name) * i.qty, 0);
    const volumoso = miudos.some((i) => ehVolumoso(i.name));

    const { opcoes, erro } = await cotarFrete(
      delivery.cep ?? "",
      pares,
      pesoMiudos,
      volumoso,
    );
    if (erro || opcoes.length === 0) {
      fail(erro || "Não consegui calcular o frete. Tente de novo.");
    }
    const opcao = opcoes.find((o) => o.id === escolhido);
    if (!opcao) fail("Essa opção de envio não está mais disponível. Escolha outra.");
    delivery.transportadora = opcao!.nome;

    // Frete grátis por região: a mesma regra que a cliente viu na sacola e no
    // checkout. Confere aqui também para o pedido gravado bater com a tela.
    const limiar = limiarDaUf(delivery.uf);
    shipping = limiar != null && subtotal >= limiar ? 0 : opcao!.preco;
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

  // Com o Mercado Pago ligado, a cliente vai direto pagar. O pedido já existe
  // antes disso: se a criação do pagamento falhar, ela cai na página do pedido
  // e não perde nada — lá tem o botão para tentar de novo e o WhatsApp.
  if (mercadoPagoAtivo() && total != null && total > 0) {
    const pedido = await getOrder(id!);
    const pref = pedido ? await criarPreferencia(pedido) : null;
    if (pref && "url" in pref) {
      await updateOrder(id!, {
        payment: { provider: "mercadopago", checkoutUrl: pref.url, preferenciaId: pref.id },
      });
      redirect(pref.url);
    }
  }

  redirect(`/pedido/${id}`);
}
