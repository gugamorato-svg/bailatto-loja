import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import {
  assinaturaValida,
  lerCabecalhoAssinatura,
  manifestoAssinatura,
  pagamentoConfere,
} from "../src/lib/mercadoPagoAssinatura";

/**
 * O webhook do Mercado Pago marca pedido como pago — o que baixa estoque e
 * conta venda. Se a validação deixar passar uma notificação forjada, qualquer
 * pessoa "paga" um pedido sem pagar.
 */

const SEGREDO = "segredo-de-teste";
const assinar = (id: string, req: string, ts: string) =>
  createHmac("sha256", SEGREDO).update(manifestoAssinatura(id, req, ts)).digest("hex");

test.describe("assinatura do webhook", () => {
  test("lê ts e v1 do cabeçalho, em qualquer ordem e com espaços", () => {
    expect(lerCabecalhoAssinatura("ts=1742505638683,v1=abc")).toEqual({
      ts: "1742505638683",
      v1: "abc",
    });
    expect(lerCabecalhoAssinatura(" v1=abc , ts=123")).toEqual({ ts: "123", v1: "abc" });
  });

  test("cabeçalho incompleto ou ausente não passa", () => {
    expect(lerCabecalhoAssinatura(null)).toBeNull();
    expect(lerCabecalhoAssinatura("ts=123")).toBeNull();
    expect(lerCabecalhoAssinatura("lixo")).toBeNull();
  });

  test("monta o manifesto no formato documentado", () => {
    expect(manifestoAssinatura("123456", "req-1", "1700")).toBe(
      "id:123456;request-id:req-1;ts:1700;",
    );
  });

  test("id alfanumérico vai em minúsculas", () => {
    expect(manifestoAssinatura("ABC123", "r", "1")).toBe("id:abc123;request-id:r;ts:1;");
  });

  test("assinatura correta é aceita", () => {
    const v1 = assinar("123456", "req-1", "1700");
    expect(
      assinaturaValida({
        segredo: SEGREDO,
        cabecalho: `ts=1700,v1=${v1}`,
        requestId: "req-1",
        dataId: "123456",
      }),
    ).toBe(true);
  });

  test("trocar o id do pagamento invalida a assinatura", () => {
    // É o ataque óbvio: reaproveitar uma assinatura válida para outro pagamento.
    const v1 = assinar("123456", "req-1", "1700");
    expect(
      assinaturaValida({
        segredo: SEGREDO,
        cabecalho: `ts=1700,v1=${v1}`,
        requestId: "req-1",
        dataId: "999999",
      }),
    ).toBe(false);
  });

  test("segredo errado, request-id trocado ou ts trocado não passam", () => {
    const v1 = assinar("123456", "req-1", "1700");
    const base = { cabecalho: `ts=1700,v1=${v1}`, requestId: "req-1", dataId: "123456" };
    expect(assinaturaValida({ ...base, segredo: "outro" })).toBe(false);
    expect(assinaturaValida({ ...base, segredo: SEGREDO, requestId: "req-2" })).toBe(false);
    expect(
      assinaturaValida({ ...base, segredo: SEGREDO, cabecalho: `ts=1701,v1=${v1}` }),
    ).toBe(false);
  });

  test("sem segredo configurado, nada passa", () => {
    // Esquecer a variável na Vercel não pode abrir a porta.
    const v1 = assinar("123456", "req-1", "1700");
    expect(
      assinaturaValida({
        segredo: "",
        cabecalho: `ts=1700,v1=${v1}`,
        requestId: "req-1",
        dataId: "123456",
      }),
    ).toBe(false);
  });

  test("assinatura de tamanho diferente não derruba a comparação", () => {
    expect(
      assinaturaValida({
        segredo: SEGREDO,
        cabecalho: "ts=1700,v1=curta",
        requestId: "req-1",
        dataId: "123456",
      }),
    ).toBe(false);
  });
});

test.describe("pagamento confere com o pedido", () => {
  const pedido = { id: "pedido-1", total: 189.9 };
  const ok = {
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 189.9,
    external_reference: "pedido-1",
  };

  test("pagamento certo confere", () => {
    expect(pagamentoConfere(ok, pedido)).toEqual({ ok: true });
  });

  test("pagamento de outro pedido não confere", () => {
    expect(pagamentoConfere({ ...ok, external_reference: "pedido-2" }, pedido).ok).toBe(false);
  });

  test("valor menor que o pedido não confere", () => {
    expect(pagamentoConfere({ ...ok, transaction_amount: 18.99 }, pedido).ok).toBe(false);
  });

  test("diferença de arredondamento de centavo é tolerada", () => {
    expect(pagamentoConfere({ ...ok, transaction_amount: 189.899999 }, pedido).ok).toBe(true);
  });

  test("outra moeda não confere", () => {
    expect(pagamentoConfere({ ...ok, currency_id: "USD" }, pedido).ok).toBe(false);
  });

  test("pedido sem total fechado não confere", () => {
    expect(pagamentoConfere(ok, { id: "pedido-1", total: null }).ok).toBe(false);
  });
});
