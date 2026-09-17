import "server-only";
import { SITE } from "./site";
import type { Order } from "./orders";

/**
 * Mercado Pago — Checkout Pro.
 *
 * A cliente é levada ao ambiente do Mercado Pago para pagar (Pix, cartão
 * parcelado ou boleto) e volta para a página do pedido. Nenhum dado de cartão
 * passa por este site.
 *
 * A confirmação NÃO vem da volta da cliente — ela pode fechar a aba antes.
 * Vem do webhook (src/app/api/mercadopago/webhook), que consulta o pagamento
 * direto na API e só então marca o pedido como pago.
 *
 * Sem MP_ACCESS_TOKEN no ambiente, nada disso é usado e o site segue com o
 * Pix copia e cola manual.
 *
 * O dinheiro cai na conta DONA do token: use as credenciais da conta do CNPJ
 * da loja, nunca de uma conta pessoal.
 */
const API = "https://api.mercadopago.com";
const TOKEN = process.env.MP_ACCESS_TOKEN;

/**
 * Ligado só com as DUAS chaves. O checkout (no navegador) decide o texto pela
 * chave pública; se o servidor olhasse só o token, uma configuração pela
 * metade faria a tela prometer uma coisa e o site fazer outra.
 */
export function mercadoPagoAtivo(): boolean {
  return !!TOKEN && !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
}

type Preferencia = { id: string; init_point: string; sandbox_init_point?: string };

export async function criarPreferencia(
  pedido: Order,
): Promise<{ id: string; url: string } | { erro: string }> {
  if (!TOKEN) return { erro: "Mercado Pago não configurado." };
  if (pedido.total == null || pedido.total <= 0) return { erro: "Pedido sem total fechado." };

  // Os itens saem do pedido já gravado, com preço recalculado no servidor —
  // nunca do que o navegador mandou.
  const itens = pedido.items
    .filter((i) => i.price != null)
    .map((i) => ({
      id: i.slug,
      title: i.name,
      quantity: i.qty,
      unit_price: Number(i.price),
      currency_id: "BRL",
      picture_url: `${SITE.url}${i.image}`,
    }));
  if (pedido.shipping && pedido.shipping > 0) {
    itens.push({
      id: "frete",
      title: `Frete${pedido.delivery.transportadora ? ` · ${pedido.delivery.transportadora}` : ""}`,
      quantity: 1,
      unit_price: pedido.shipping,
      currency_id: "BRL",
      picture_url: `${SITE.url}/loja.jpg`,
    });
  }

  const [nome, ...sobrenome] = pedido.customer.name.trim().split(/\s+/);
  const voltar = `${SITE.url}/pedido/${pedido.id}`;

  const corpo = {
    items: itens,
    // É por aqui que o webhook sabe de qual pedido é o pagamento.
    external_reference: pedido.id,
    payer: {
      name: nome,
      surname: sobrenome.join(" ") || undefined,
      email: pedido.customer.email || undefined,
    },
    back_urls: { success: voltar, pending: voltar, failure: voltar },
    auto_return: "approved",
    statement_descriptor: "BAILATTO",
    metadata: { pedido: pedido.number },
  };

  try {
    const r = await fetch(`${API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        // Retentar a criação não pode gerar duas preferências para o mesmo pedido.
        "X-Idempotency-Key": `pref-${pedido.id}`,
      },
      body: JSON.stringify(corpo),
    });
    if (!r.ok) {
      const texto = (await r.text()).slice(0, 300);
      console.error("Mercado Pago recusou a preferência:", r.status, texto);
      return { erro: "Não foi possível abrir o pagamento agora." };
    }
    const p = (await r.json()) as Preferencia;
    return { id: p.id, url: p.init_point };
  } catch (e) {
    console.error("Mercado Pago indisponível:", e);
    return { erro: "Não foi possível abrir o pagamento agora." };
  }
}

export type PagamentoMP = {
  id: number;
  status?: string;
  status_detail?: string;
  currency_id?: string;
  transaction_amount?: number;
  external_reference?: string;
  payment_type_id?: string;
  date_approved?: string | null;
};

/** Busca o pagamento direto na API: é a única fonte em que dá para confiar. */
export async function buscarPagamento(id: string): Promise<PagamentoMP | null> {
  if (!TOKEN) return null;
  // O id vem de fora (query string da notificação): só dígitos.
  if (!/^\d+$/.test(id)) return null;
  const r = await fetch(`${API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!r.ok) {
    console.error("Mercado Pago: pagamento", id, "respondeu", r.status);
    return null;
  }
  return (await r.json()) as PagamentoMP;
}
