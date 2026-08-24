import crypto from "node:crypto";
import { getSupabaseAdmin, BUCKET_PRIVADO } from "./supabaseAdmin";

// Pedidos ficam no bucket PRIVADO — contêm nome, telefone, e-mail e CPF.
// Já eram lidos/gravados com a service key, que acessa bucket privado igual.
const ORDERS_PATH = "data/orders.json";

export type OrderStatus =
  | "aguardando"
  | "pago"
  | "enviado"
  | "entregue"
  | "cancelado";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

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
  /** Preenchido quando integrarmos o Pix (BB). */
  payment?: {
    provider?: string;
    txid?: string;
    paidAt?: string;
  };
  tracking?: string;
};

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
  const order: Order = {
    ...input,
    id: crypto.randomUUID(),
    number: 1000 + list.length + 1,
    createdAt: new Date().toISOString(),
    status: "aguardando",
  };
  list.push(order);
  const err = await saveOrders(list);
  if (err) return { error: err };
  return { id: order.id };
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "tracking" | "payment">>,
): Promise<string | null> {
  const list = await loadOrders();
  const i = list.findIndex((o) => o.id === id);
  if (i < 0) return "Pedido não encontrado.";
  list[i] = { ...list[i], ...patch };
  return saveOrders(list);
}
