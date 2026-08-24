import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrder, DELIVERY_LABEL, STATUS_LABEL } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { PixPagamento } from "@/components/PixPagamento";
import { gerarPixCopiaECola } from "@/lib/pix";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedido confirmado — BAILATTO" };

const WA = "5516993392022";

export default async function PedidoPage({
  params,
}: PageProps<"/pedido/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const linhas = order.items
    .map((i) => `• ${i.name} — Nº ${i.size} — ${i.qty}x`)
    .join("\n");
  const msg = encodeURIComponent(
    `Olá! Acabei de fazer o pedido #${order.number} no site da BAILATTO.\n\n` +
      `${linhas}\n\n` +
      `${DELIVERY_LABEL[order.delivery.method]}\n` +
      (order.total != null ? `Total: ${formatPrice(order.total)}\n` : "") +
      `\nGostaria de combinar o pagamento.`,
  );

  const end = order.delivery;

  // Pix só faz sentido quando o total está fechado (frete definido e itens com preço).
  let pix: { codigo: string; qr: string } | null = null;
  if (order.total != null && order.total > 0 && order.status === "aguardando") {
    const codigo = gerarPixCopiaECola(order.total, `BAILATTO${order.number}`);
    pix = {
      codigo,
      qr: await QRCode.toDataURL(codigo, { width: 400, margin: 1 }),
    };
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <ClearCartOnMount />

      <div className="text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-3 font-serif text-3xl text-text">
          Pedido confirmado!
        </h1>
        <p className="mt-2 text-text-2">
          Seu pedido <strong className="text-text">#{order.number}</strong> foi
          registrado. Agora é só combinar o pagamento com a gente.
        </p>
      </div>

      {pix ? (
        <PixPagamento codigo={pix.codigo} qrCode={pix.qr} valor={order.total!} />
      ) : null}

      <a
        href={`https://wa.me/${WA}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className={
          pix
            ? "mt-4 block rounded-[2px] border border-wine px-6 py-3 text-center text-sm uppercase tracking-wide text-wine hover:bg-wine hover:text-on-wine"
            : "mt-8 block rounded-[2px] bg-wine px-6 py-4 text-center text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        }
      >
        {pix ? "Enviar comprovante no WhatsApp" : "Combinar pagamento no WhatsApp"}
      </a>

      <div className="mt-10 rounded-[2px] border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text">Resumo</h2>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-text-2">
            {STATUS_LABEL[order.status]}
          </span>
        </div>

        <ul className="mt-5 space-y-3">
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

        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-text-2">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-2">
            <span>
              Frete · {order.delivery.transportadora ?? DELIVERY_LABEL[order.delivery.method]}
            </span>
            <span>
              {order.shipping == null ? "a combinar" : formatPrice(order.shipping)}
            </span>
          </div>
          <div className="flex justify-between pt-2 text-base text-text">
            <span>Total</span>
            <span>{order.total == null ? "a combinar" : formatPrice(order.total)}</span>
          </div>
        </div>

        {order.delivery.method !== "retirada" && end.street && (
          <div className="mt-5 border-t border-border pt-4 text-sm text-text-2">
            <p className="mb-1 font-medium text-text">Endereço de entrega</p>
            <p>
              {end.street}, {end.number}
              {end.complement ? ` — ${end.complement}` : ""}
            </p>
            <p>
              {end.district ? `${end.district} · ` : ""}
              {end.city}
              {end.uf ? ` - ${end.uf}` : ""}
              {end.cep ? ` · ${end.cep}` : ""}
            </p>
          </div>
        )}

        {order.delivery.method === "retirada" && (
          <div className="mt-5 border-t border-border pt-4 text-sm text-text-2">
            <p className="mb-1 font-medium text-text">Retirada na loja</p>
            <div className="mt-2 flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/loja.jpg"
                alt="Fachada da loja BAILATTO"
                className="h-20 w-28 shrink-0 rounded-[2px] object-cover"
              />
              <span>
                Rua Geminiano Costa, 416 — Centro, São Carlos-SP
                <br />
                Seg a sex, 9h às 18h · Sábado, 9h às 13h
                <br />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=BAILATTO+Cal%C3%A7ados+Rua+Geminiano+Costa+416+S%C3%A3o+Carlos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline"
                >
                  Ver no mapa →
                </a>
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-text-2">
        Guarde o número <strong className="text-text">#{order.number}</strong>.{" "}
        <Link href="/produtos" className="text-wine hover:underline">
          Continuar comprando
        </Link>
      </p>
    </section>
  );
}
