/**
 * Status do pedido e o que cada mudança implica. Módulo sem dependência de
 * servidor, para dar para testar sem Supabase nem Meta.
 */
export type OrderStatus =
  | "aguardando"
  | "pago"
  | "enviado"
  | "entregue"
  | "cancelado"
  | "devolvido";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  devolvido: "Devolvido",
};

export const TODOS_STATUS = Object.keys(STATUS_LABEL) as OrderStatus[];

/**
 * Estados em que o dinheiro já entrou e a mercadoria já saiu do estoque.
 * "Cancelado" e "devolvido" são diferentes: cancelado é pedido desfeito;
 * devolvido é mercadoria que voltou depois de paga.
 */
export const PAGOS: OrderStatus[] = ["pago", "enviado", "entregue"];

/**
 * O que uma mudança de status implica. Os efeitos saem da TRANSIÇÃO, não do
 * status final — salvar o mesmo pedido duas vezes, ou só corrigir o rastreio,
 * não pode baixar estoque nem contar venda de novo.
 */
export function efeitosDaTransicao(antes: OrderStatus, depois: OrderStatus) {
  const eraPago = PAGOS.includes(antes);
  const ficouPago = PAGOS.includes(depois);
  return {
    // Vale também para quem pula direto de "aguardando" para "enviado".
    baixarEstoque: !eraPago && ficouPago,
    contarVenda: !eraPago && ficouPago,
    // Mercadoria voltou, ou a venda paga foi desfeita.
    devolverEstoque: eraPago && (depois === "devolvido" || depois === "cancelado"),
  };
}
