import crypto from "node:crypto";
import { registrarCompra } from "./rastreamentoServidor";
import { movimentarEstoque } from "./db";
import { getSupabaseAdmin, BUCKET_PRIVADO } from "./supabaseAdmin";
import { efeitosDaTransicao, type OrderStatus } from "./statusPedido";

export {
  STATUS_LABEL,
  TODOS_STATUS,
  PAGOS,
  efeitosDaTransicao,
  type OrderStatus,
} from "./statusPedido";

// Pedidos ficam no bucket PRIVADO — contêm nome, telefone, e-mail e CPF.
// Já eram lidos/gravados com a service key, que acessa bucket privado igual.
const ORDERS_PATH = "data/orders.json";

/** Direito de arrependimento (CDC art. 49): 7 dias contados do recebimento. */
export const PRAZO_ARREPENDIMENTO_DIAS = 7;

export type DeliveryMethod = "retirada" | "entrega_local" | "correios";

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  retirada: "Retirada na loja",
  entrega_local: "Entrega em São Carlos",
  correios: "Envio para outra cidade",
};

/** Frete por método. null = a combinar. */
export const DELIVERY_PRICE: Record<DeliveryMethod, number | null> = {
  retirada: 0,
  entrega_local: 10,
  correios: null,
};

export type OrderItem = {
  slug: string;
  name: string;
  size: number;
  qty: number;
  price: number | null;
  image: string;
};

export type Order = {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    email: string;
    cpf: string;
  };
  delivery: {
    method: DeliveryMethod;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    uf?: string;
    /** nome do servico escolhido (ex.: PAC, SEDEX) quando o frete e calculado */
    transportadora?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number | null;
  total: number | null;
  payment?: {
    provider?: string;
    /** id do pagamento no provedor (no Mercado Pago, o payment id). */
    txid?: string;
    paidAt?: string;
    /** Último status informado pelo provedor: approved, pending, refunded... */
    status?: string;
    /** Forma usada: pix, credit_card, ticket (boleto)... */
    metodo?: string;
    /** Link do Checkout Pro, para a cliente tentar de novo se desistiu. */
    checkoutUrl?: string;
    preferenciaId?: string;
  };
  tracking?: string;
  /**
   * Cada mudança de status com a data. É daqui que sai o prazo de
   * arrependimento — ele corre do recebimento, não da compra.
   */
  historico?: { status: OrderStatus; em: string }[];
  /** Preenchido à mão por enquanto; vira automático com o emissor de NF-e. */
  notaFiscal?: { numero?: string; chave?: string };
};

/** Quando o pedido foi marcado como entregue (ou retirado), se foi. */
export function dataRecebimento(order: Order): Date | null {
  const h = order.historico ?? [];
  for (let i = h.length - 1; i >= 0; i--) {
    if (h[i].status === "entregue") return new Date(h[i].em);
  }
  return null;
}

/**
 * Prazo de arrependimento do pedido. `limite` é null enquanto a mercadoria
 * não foi recebida — o prazo ainda nem começou a correr.
 */
export function prazoArrependimento(order: Order): { limite: Date; aberto: boolean } | null {
  const recebido = dataRecebimento(order);
  if (!recebido) return null;
  const limite = new Date(recebido);
  limite.setDate(limite.getDate() + PRAZO_ARREPENDIMENTO_DIAS);
  return { limite, aberto: limite.getTime() >= Date.now() };
}

/** Chave de acesso da NF-e: 44 dígitos. Aceita com espaço ou ponto. */
export function normalizarChaveNfe(v: string): string | null {
  const so = v.replace(/\D/g, "");
  return so.length === 44 ? so : null;
}

async function loadOrders(): Promise<Order[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET_PRIVADO)
      .download(ORDERS_PATH);
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

async function saveOrders(list: Order[]): Promise<string | null> {
  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET_PRIVADO)
    .upload(ORDERS_PATH, JSON.stringify(list, null, 2), {
      upsert: true,
      contentType: "application/json",
    });
  return error?.message ?? null;
}

export async function listOrders(): Promise<Order[]> {
  const list = await loadOrders();
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | null> {
  const list = await loadOrders();
  return list.find((o) => o.id === id) ?? null;
}

export async function createOrder(
  input: Omit<Order, "id" | "number" | "createdAt" | "status">,
): Promise<{ id?: string; error?: string }> {
  const list = await loadOrders();
  const agora = new Date().toISOString();
  const order: Order = {
    ...input,
    id: crypto.randomUUID(),
    number: 1000 + list.length + 1,
    createdAt: agora,
    status: "aguardando",
    historico: [{ status: "aguardando", em: agora }],
  };
  list.push(order);
  const err = await saveOrders(list);
  if (err) return { error: err };
  return { id: order.id };
}

/**
 * Atualiza o pedido e aplica o que cada mudança de status implica.
 *
 * Todos os efeitos saem da TRANSIÇÃO, não do status final — assim salvar o
 * mesmo pedido duas vezes (ou só corrigir o rastreio) não baixa estoque nem
 * conta venda de novo. Quem chama é o painel hoje e o webhook do pagamento
 * depois: os dois passam por aqui e ganham o mesmo comportamento.
 */
export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "tracking" | "payment" | "notaFiscal">>,
): Promise<string | null> {
  const list = await loadOrders();
  const i = list.findIndex((o) => o.id === id);
  if (i < 0) return "Pedido não encontrado.";

  const antes = list[i].status;
  const depois = patch.status ?? antes;
  const mudou = depois !== antes;

  list[i] = {
    ...list[i],
    ...patch,
    // Mescla em vez de trocar: o webhook grava o status do pagamento e não
    // pode apagar o link de checkout que foi salvo na criação do pedido.
    payment: patch.payment ? { ...list[i].payment, ...patch.payment } : list[i].payment,
    historico: mudou
      ? [...(list[i].historico ?? []), { status: depois, em: new Date().toISOString() }]
      : list[i].historico,
  };
  const erro = await saveOrders(list);
  if (erro) return erro;
  if (!mudou) return null;

  const p = list[i];
  const movimentos = p.items.map((it) => ({ slug: it.slug, size: it.size, qty: it.qty }));
  const efeito = efeitosDaTransicao(antes, depois);

  if (efeito.contarVenda) {
    // Com Pix manual, pedido feito e pedido pago são momentos diferentes; a
    // conversão só conta no segundo.
    await registrarCompra({
      id: p.id,
      total: p.total ?? 0,
      email: p.customer?.email,
      telefone: p.customer?.phone,
      itens: movimentos,
    });
  }
  if (efeito.baixarEstoque) {
    const e = await movimentarEstoque(movimentos, -1);
    if (e) return `Pedido salvo, mas o estoque não foi baixado (${e}). Ajuste no painel.`;
  }
  if (efeito.devolverEstoque) {
    const e = await movimentarEstoque(movimentos, 1);
    if (e) return `Pedido salvo, mas o estoque não foi devolvido (${e}). Ajuste no painel.`;
  }

  return null;
}
