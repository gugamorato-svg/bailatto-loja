import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validação da assinatura do webhook do Mercado Pago. Módulo sem rede nem
 * credencial, para dar para testar isolado.
 *
 * O cabeçalho `x-signature` vem como `ts=<milissegundos>,v1=<hmac>`. O HMAC é
 * SHA-256, em hexadecimal, com a chave secreta do webhook, sobre o texto:
 *
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * `data.id` sai da QUERY STRING da notificação, não do corpo.
 * Referência: developers.mercadopago.com.br › Checkout Pro › Notificações.
 */
export function lerCabecalhoAssinatura(
  cabecalho: string | null,
): { ts: string; v1: string } | null {
  if (!cabecalho) return null;
  let ts = "";
  let v1 = "";
  for (const parte of cabecalho.split(",")) {
    const [chave, ...resto] = parte.split("=");
    const valor = resto.join("=").trim();
    if (chave.trim() === "ts") ts = valor;
    if (chave.trim() === "v1") v1 = valor;
  }
  return ts && v1 ? { ts, v1 } : null;
}

export function manifestoAssinatura(dataId: string, requestId: string, ts: string): string {
  // Id alfanumérico precisa ir em minúsculas; em id numérico não muda nada.
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
}

export function assinaturaValida(opcoes: {
  segredo: string;
  cabecalho: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const { segredo, cabecalho, requestId, dataId } = opcoes;
  if (!segredo || !requestId || !dataId) return false;
  const lido = lerCabecalhoAssinatura(cabecalho);
  if (!lido) return false;

  const esperado = createHmac("sha256", segredo)
    .update(manifestoAssinatura(dataId, requestId, lido.ts))
    .digest("hex");

  // Comparação em tempo constante: comparar string com === vaza, pelo tempo de
  // resposta, quantos caracteres do chute estavam certos.
  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(lido.v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * O pagamento que chegou corresponde mesmo a este pedido? A assinatura prova
 * que a notificação veio do Mercado Pago; isto prova que o dinheiro é o certo.
 */
export function pagamentoConfere(
  pagamento: { status?: string; currency_id?: string; transaction_amount?: number; external_reference?: string },
  pedido: { id: string; total: number | null },
): { ok: true } | { ok: false; motivo: string } {
  if (pagamento.external_reference !== pedido.id) {
    return { ok: false, motivo: "pagamento de outro pedido" };
  }
  if (pagamento.currency_id !== "BRL") {
    return { ok: false, motivo: `moeda ${pagamento.currency_id}` };
  }
  if (pedido.total == null) {
    return { ok: false, motivo: "pedido sem total fechado" };
  }
  // Centavo de tolerância para arredondamento de ponto flutuante.
  if ((pagamento.transaction_amount ?? 0) + 0.01 < pedido.total) {
    return {
      ok: false,
      motivo: `valor pago ${pagamento.transaction_amount} menor que o pedido ${pedido.total}`,
    };
  }
  return { ok: true };
}
