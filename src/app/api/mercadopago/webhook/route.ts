import { NextResponse } from "next/server";
import { buscarPagamento, mercadoPagoAtivo } from "@/lib/mercadoPago";
import { assinaturaValida, pagamentoConfere } from "@/lib/mercadoPagoAssinatura";
import { getOrder, updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Notificação de pagamento do Mercado Pago.
 *
 * É esta rota que marca o pedido como pago — e marcar como pago baixa o
 * estoque e conta a venda para a Meta. Por isso nada aqui confia no corpo da
 * requisição:
 *
 * 1. a assinatura prova que a notificação veio do Mercado Pago;
 * 2. o pagamento é buscado direto na API, com o nosso token;
 * 3. o pagamento tem de ser deste pedido, em reais, e no valor certo.
 *
 * Responder 200 encerra as tentativas. Responder 5xx faz o Mercado Pago tentar
 * de novo (15 min, 30 min, 6 h...) — é o que queremos quando a falha é nossa.
 * Notificação repetida é inofensiva: os efeitos do pedido saem da mudança de
 * status, e aprovar um pedido já pago não muda nada.
 */
export async function POST(request: Request) {
  if (!mercadoPagoAtivo()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const url = new URL(request.url);
  let corpo: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    corpo = await request.json();
  } catch {
    // Algumas notificações chegam sem corpo; o que importa está na query.
  }

  const tipo = url.searchParams.get("type") ?? corpo.type;
  // Só pagamentos interessam aqui. Responder 200 para o resto evita retentativa.
  if (tipo !== "payment") return NextResponse.json({ ok: true, ignorado: tipo });

  const dataId = url.searchParams.get("data.id") ?? (corpo.data?.id != null ? String(corpo.data.id) : null);

  const segredo = process.env.MP_WEBHOOK_SECRET ?? "";
  const valida = assinaturaValida({
    segredo,
    cabecalho: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!valida) {
    console.warn("Webhook Mercado Pago com assinatura inválida", { dataId });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pagamento = await buscarPagamento(String(dataId));
  if (!pagamento) {
    // Falha nossa ou da API: pede para tentar de novo.
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const pedidoId = pagamento.external_reference;
  const pedido = pedidoId ? await getOrder(pedidoId) : null;
  if (!pedido) {
    // Pagamento que não é de pedido do site (ex.: venda pela maquininha na
    // mesma conta). Não há o que atualizar, e retentar não vai mudar isso.
    return NextResponse.json({ ok: true, ignorado: "sem pedido" });
  }

  const registro = {
    provider: "mercadopago",
    txid: String(pagamento.id),
    status: pagamento.status,
    metodo: pagamento.payment_type_id,
  };

  if (pagamento.status !== "approved") {
    // Pendente, recusado, estornado: só registra. Estorno e chargeback são
    // decisões da loja (a mercadoria pode já ter saído), então o status do
    // pedido não muda sozinho — o painel mostra o que aconteceu.
    const erro = await updateOrder(pedido.id, { payment: registro });
    return erro
      ? NextResponse.json({ ok: false }, { status: 500 })
      : NextResponse.json({ ok: true, status: pagamento.status });
  }

  const confere = pagamentoConfere(pagamento, pedido);
  if (!confere.ok) {
    console.error("Pagamento aprovado não confere com o pedido", pedido.number, confere.motivo);
    await updateOrder(pedido.id, { payment: { ...registro, status: `divergente: ${confere.motivo}` } });
    // 200: não adianta retentar, precisa de gente olhando.
    return NextResponse.json({ ok: false, motivo: confere.motivo });
  }

  // Aprovar só muda algo se o pedido ainda estava aguardando. Um pedido já
  // enviado ou entregue não pode voltar para "pago" por uma notificação atrasada.
  const status = pedido.status === "aguardando" ? "pago" : pedido.status;
  const erro = await updateOrder(pedido.id, {
    status,
    payment: { ...registro, paidAt: pagamento.date_approved ?? new Date().toISOString() },
  });
  if (erro && erro.startsWith("Pedido salvo")) {
    // O pedido já foi gravado como pago; só a baixa de estoque falhou. Retentar
    // não resolve: na próxima tentativa o status já é "pago", não há transição
    // e o estoque não seria mexido. Fica no log para ajuste manual.
    console.error("Webhook Mercado Pago:", erro);
    return NextResponse.json({ ok: true, aviso: erro });
  }
  if (erro) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, status: "approved" });
}
