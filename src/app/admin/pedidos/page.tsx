import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listOrders, STATUS_LABEL, DELIVERY_LABEL } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos — BAILATTO" };

function dataBR(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPedidos() {
  await requireAdmin();
  const orders = await listOrders();
  const aguardando = orders.filter((o) => o.status === "aguardando").length;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-serif text-xl tracking-[0.25em] text-text-2">BAILATTO</p>
          <h1 className="font-serif text-3xl text-text">Pedidos</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-text-2 hover:text-wine">
            Produtos
          </Link>
          <Link href="/" className="text-sm text-text-2 hover:text-wine">
            Ver loja ↗
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-text-2 hover:text-wine">
              Sair
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-text-2">
        {orders.length} pedido(s)
        {aguardando > 0 && (
          <span className="ml-2 rounded-full bg-wine px-2.5 py-0.5 text-xs text-on-wine">
            {aguardando} aguardando
          </span>
        )}
      </p>

      <div className="mt-4 overflow-x-auto rounded-[2px] border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-text-2">
            <tr>
              <th className="p-3 font-medium">Nº</th>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Itens</th>
              <th className="p-3 font-medium">Entrega</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 text-text">#{o.number}</td>
                <td className="p-3 text-text-2">{dataBR(o.createdAt)}</td>
                <td className="p-3">
                  <span className="block text-text">{o.customer.name}</span>
                  <span className="block text-text-2">{o.customer.phone}</span>
                </td>
                <td className="p-3 text-text-2">
                  {o.items.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td className="p-3 text-text-2">
                  {DELIVERY_LABEL[o.delivery.method]}
                </td>
                <td className="p-3 text-wine">
                  {o.total == null ? "a combinar" : formatPrice(o.total)}
                </td>
                <td className="p-3 text-text-2">{STATUS_LABEL[o.status]}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="text-wine hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-2">
                  Nenhum pedido ainda. Quando alguém comprar pelo site, aparece
                  aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
