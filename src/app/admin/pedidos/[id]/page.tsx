import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getOrder,
  STATUS_LABEL,
  DELIVERY_LABEL,
  type OrderStatus,
} from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { updateOrderAction } from "../../actions";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "aguardando",
  "pago",
  "enviado",
  "entregue",
  "cancelado",
];

export default async function AdminPedido({
  params,
  searchParams,
}: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const order = await getOrder(id);
  if (!order) notFound();

  const end = order.delivery;
  const waLink = `https://wa.me/55${order.customer.phone.replace(/\D/g, "")}`;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin/pedidos" className="text-sm text-text-2 hover:text-wine">
        ← Voltar aos pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-text">Pedido #{order.number}</h1>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-text-2">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {sp?.ok && (
        <p className="mt-4 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          Pedido atualizado ✓
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[2px] border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 font-serif text-lg text-text">Cliente</h2>
          <p className="text-text">{order.customer.name}</p>
          <p className="text-text-2">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-wine">
              {order.customer.phone} ↗
            </a>
          </p>
          {order.customer.email && <p className="text-text-2">{order.customer.email}</p>}
          {order.customer.cpf && <p className="text-text-2">CPF: {order.customer.cpf}</p>}
        </div>

        <div className="rounded-[2px] border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 font-serif text-lg text-text">Entrega</h2>
          <p className="text-text">
            {DELIVERY_LABEL[order.delivery.method]}
            {order.delivery.transportadora ? ` · ${order.delivery.transportadora}` : ""}
          </p>
          {order.delivery.method === "retirada" ? (
            <p className="text-text-2">Rua Geminiano Costa, 416 — Centro</p>
          ) : (
            <div className="text-text-2">
              <p>
                {end.street}, {end.number}
                {end.complement ? ` — ${end.complement}` : ""}
              </p>
              <p>
                {end.district ? `${end.district} · ` : ""}
                {end.city}
                {end.uf ? ` - ${end.uf}` : ""}
              </p>
              {end.cep && <p>CEP {end.cep}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-[2px] border border-border bg-surface p-5">
        <h2 className="mb-4 font-serif text-lg text-text">Itens</h2>
        <ul className="space-y-3">
          {order.items.map((i) => (
            <li key={`${i.slug}-${i.size}`} className="flex gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[2px] bg-surface-2">
                <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p className="text-text">{i.name}</p>
                <p className="text-text-2">
                  Nº {i.size} · {i.qty}x
                </p>
              </div>
              <p className="text-sm text-wine">{formatPrice(i.price)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-text-2">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-2">
            <span>Frete</span>
            <span>{order.shipping == null ? "a combinar" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between text-base text-text">
            <span>Total</span>
            <span>{order.total == null ? "a combinar" : formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <form
        action={updateOrderAction}
        className="mt-6 rounded-[2px] border border-border bg-surface p-5"
      >
        <input type="hidden" name="id" value={order.id} />
        <h2 className="mb-4 font-serif text-lg text-text">Atualizar pedido</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">Status</span>
            <select
              name="status"
              defaultValue={order.status}
              className="w-full rounded-[2px] border border-border bg-bg px-4 py-2.5 text-text outline-none focus:border-wine"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">
              Código de rastreio (opcional)
            </span>
            <input
              name="tracking"
              defaultValue={order.tracking ?? ""}
              className="w-full rounded-[2px] border border-border bg-bg px-4 py-2.5 text-text outline-none focus:border-wine"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 rounded-[2px] bg-wine px-8 py-3 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          Salvar
        </button>
      </form>
    </section>
  );
}
