import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getOrder,
  prazoArrependimento,
  STATUS_LABEL,
  DELIVERY_LABEL,
  TODOS_STATUS,
} from "@/lib/orders";
import { rotuloTamanho } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { updateOrderAction } from "../../actions";

export const dynamic = "force-dynamic";

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const data = (d: Date) =>
  d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

// Status e formas de pagamento do Mercado Pago, em português.
const ROTULO_PAGAMENTO: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  in_process: "Em análise",
  authorized: "Autorizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Estornado",
  charged_back: "Contestado (chargeback)",
  in_mediation: "Em disputa",
};

const ROTULO_METODO: Record<string, string> = {
  pix: "Pix",
  bank_transfer: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  ticket: "Boleto",
  account_money: "Saldo Mercado Pago",
};

const campo =
  "w-full rounded-[2px] border border-border bg-bg px-4 py-2.5 text-text outline-none focus:border-wine";

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
  const prazo = prazoArrependimento(order);

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
      {typeof sp?.erro === "string" && (
        <p className="mt-4 rounded-[2px] border border-wine bg-surface p-3 text-sm text-wine">
          {sp.erro}
        </p>
      )}

      {/* Prazo de arrependimento: é a pergunta que chega quando a cliente quer
          devolver. Com a data na tela, não precisa fazer conta. */}
      {prazo && (
        <p className="mt-4 rounded-[2px] border border-border bg-surface p-3 text-sm text-text-2">
          {prazo.aberto ? (
            <>
              Dentro do prazo de arrependimento — a cliente pode desistir até{" "}
              <strong className="text-text">{data(prazo.limite)}</strong>, sem precisar
              justificar. O frete de volta é da loja.
            </>
          ) : (
            <>
              Prazo de arrependimento encerrado em{" "}
              <strong className="text-text">{data(prazo.limite)}</strong>. Devolução
              agora só por defeito.
            </>
          )}
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
                  {rotuloTamanho(i.size)} · {i.qty}x
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

      {order.payment?.provider && (
        <div className="mt-6 rounded-[2px] border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 font-serif text-lg text-text">Pagamento</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-text-2">
            <dt>Provedor</dt>
            <dd className="text-text">
              {order.payment.provider === "mercadopago" ? "Mercado Pago" : order.payment.provider}
            </dd>
            {order.payment.status && (
              <>
                <dt>Situação</dt>
                <dd className="text-text">
                  {ROTULO_PAGAMENTO[order.payment.status] ?? order.payment.status}
                </dd>
              </>
            )}
            {order.payment.metodo && (
              <>
                <dt>Forma</dt>
                <dd className="text-text">
                  {ROTULO_METODO[order.payment.metodo] ?? order.payment.metodo}
                </dd>
              </>
            )}
            {order.payment.txid && (
              <>
                <dt>Nº no Mercado Pago</dt>
                <dd className="font-mono text-text">{order.payment.txid}</dd>
              </>
            )}
            {order.payment.paidAt && (
              <>
                <dt>Aprovado em</dt>
                <dd className="text-text">{dataHora(order.payment.paidAt)}</dd>
              </>
            )}
          </dl>
          {/* Estorno, chargeback e valor divergente não mudam o pedido sozinhos:
              a mercadoria pode já ter saído, então é decisão de quem atende. */}
          {order.payment.status &&
            (["refunded", "charged_back", "in_mediation"].includes(order.payment.status) ||
              order.payment.status.startsWith("divergente")) && (
              <p className="mt-3 rounded-[2px] border border-wine bg-bg p-3 text-wine">
                Atenção: este pagamento precisa de conferência antes de enviar ou
                trocar a mercadoria.
              </p>
            )}
          {order.payment.status === "approved" && order.status === "cancelado" && (
            <p className="mt-3 rounded-[2px] border border-wine bg-bg p-3 text-wine">
              O pagamento foi aprovado, mas o pedido está cancelado. Estorne pelo
              Mercado Pago ou reabra o pedido.
            </p>
          )}
        </div>
      )}

      {order.historico && order.historico.length > 0 && (
        <div className="mt-6 rounded-[2px] border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 font-serif text-lg text-text">Histórico</h2>
          <ol className="space-y-1.5">
            {order.historico.map((h, n) => (
              <li key={n} className="flex justify-between gap-4 text-text-2">
                <span className="text-text">{STATUS_LABEL[h.status]}</span>
                <span>{dataHora(h.em)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <form
        action={updateOrderAction}
        className="mt-6 rounded-[2px] border border-border bg-surface p-5"
      >
        <input type="hidden" name="id" value={order.id} />
        <h2 className="mb-4 font-serif text-lg text-text">Atualizar pedido</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">Status</span>
            <select name="status" defaultValue={order.status} className={campo}>
              {TODOS_STATUS.map((s) => (
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
            <input name="tracking" defaultValue={order.tracking ?? ""} className={campo} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">
              Número da NF-e (opcional)
            </span>
            <input
              name="nfNumero"
              inputMode="numeric"
              defaultValue={order.notaFiscal?.numero ?? ""}
              className={campo}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">
              Chave de acesso da NF-e (44 dígitos)
            </span>
            <input
              name="nfChave"
              inputMode="numeric"
              defaultValue={order.notaFiscal?.chave ?? ""}
              className={campo}
            />
          </label>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-text-2">
          Ao marcar como <strong>Pago</strong> o estoque do site é baixado. Ao marcar
          um pedido pago como <strong>Devolvido</strong> ou <strong>Cancelado</strong>,
          ele volta. Lance a venda e a devolução no Phibo também — a próxima
          importação da planilha substitui o estoque do site pelo do Phibo.
        </p>

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
