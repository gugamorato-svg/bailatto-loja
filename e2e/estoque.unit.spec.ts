import { test, expect } from "@playwright/test";
import { aplicarMovimentos } from "../src/lib/db";
import { efeitosDaTransicao, TODOS_STATUS } from "../src/lib/statusPedido";
import type { Product } from "../src/lib/products";

/**
 * Estoque e status do pedido, sem navegador e sem Supabase.
 *
 * Estas funções escrevem no catálogo de verdade quando rodam no site: um erro
 * aqui aparece como produto esgotado que não está, ou peça única vendida duas
 * vezes. Por isso a conta é testada isolada.
 */

const bota = (): Product => ({
  slug: "bota",
  name: "Bota",
  category: "botas",
  description: "",
  price: 189.9,
  image: "",
  sizes: [36, 37],
  estoque: { "36": 2, "37": 1 },
});

const brinco = (): Product => ({
  slug: "brinco",
  name: "Brinco",
  category: "semijoias",
  description: "",
  price: 15,
  image: "",
  sizes: [],
  estoque: { U: 1 },
  tamanhoUnico: true,
});

test.describe("aplicarMovimentos", () => {
  test("baixa uma unidade e mantém a numeração", () => {
    const [p] = aplicarMovimentos([bota()], [{ slug: "bota", size: 36, qty: 1 }], -1);
    expect(p.estoque).toEqual({ "36": 1, "37": 1 });
    expect(p.sizes).toEqual([36, 37]);
  });

  test("a última unidade tira a numeração da vitrine", () => {
    const [p] = aplicarMovimentos([bota()], [{ slug: "bota", size: 37, qty: 1 }], -1);
    expect(p.estoque?.["37"]).toBe(0);
    expect(p.sizes).toEqual([36]);
  });

  test("devolução traz a numeração de volta, em ordem", () => {
    const zerada = { ...bota(), sizes: [37], estoque: { "36": 0, "37": 1 } };
    const [p] = aplicarMovimentos([zerada], [{ slug: "bota", size: 36, qty: 1 }], 1);
    expect(p.estoque?.["36"]).toBe(1);
    expect(p.sizes).toEqual([36, 37]);
  });

  test("tamanho único mexe na chave U e nunca ganha numeração", () => {
    const [p] = aplicarMovimentos([brinco()], [{ slug: "brinco", size: 0, qty: 1 }], -1);
    expect(p.estoque).toEqual({ U: 0 });
    expect(p.sizes).toEqual([]);
  });

  test("estoque nunca fica negativo", () => {
    const [p] = aplicarMovimentos([bota()], [{ slug: "bota", size: 37, qty: 5 }], -1);
    expect(p.estoque?.["37"]).toBe(0);
  });

  test("produto sem controle de estoque não é tocado", () => {
    const livre = { ...bota(), estoque: null };
    const [p] = aplicarMovimentos([livre], [{ slug: "bota", size: 36, qty: 1 }], -1);
    expect(p).toEqual(livre);
  });

  test("não altera a lista original", () => {
    const original = [bota()];
    aplicarMovimentos(original, [{ slug: "bota", size: 36, qty: 1 }], -1);
    expect(original[0].estoque).toEqual({ "36": 2, "37": 1 });
  });

  test("vender e devolver volta exatamente ao começo", () => {
    const venda = [
      { slug: "bota", size: 37, qty: 1 },
      { slug: "brinco", size: 0, qty: 1 },
    ];
    const inicio = [bota(), brinco()];
    const depois = aplicarMovimentos(aplicarMovimentos(inicio, venda, -1), venda, 1);
    expect(depois).toEqual(inicio);
  });
});

test.describe("efeitosDaTransicao", () => {
  test("pagamento baixa estoque e conta a venda", () => {
    expect(efeitosDaTransicao("aguardando", "pago")).toEqual({
      baixarEstoque: true,
      contarVenda: true,
      devolverEstoque: false,
    });
  });

  test("pular direto para enviado também conta como pago", () => {
    expect(efeitosDaTransicao("aguardando", "enviado").baixarEstoque).toBe(true);
  });

  test("andar entre estados pagos não mexe em nada", () => {
    for (const [a, d] of [["pago", "enviado"], ["enviado", "entregue"], ["pago", "entregue"]] as const) {
      expect(efeitosDaTransicao(a, d)).toEqual({
        baixarEstoque: false,
        contarVenda: false,
        devolverEstoque: false,
      });
    }
  });

  test("devolução ou cancelamento depois de pago devolve o estoque", () => {
    expect(efeitosDaTransicao("entregue", "devolvido").devolverEstoque).toBe(true);
    expect(efeitosDaTransicao("pago", "cancelado").devolverEstoque).toBe(true);
  });

  test("cancelar antes de pagar não devolve o que nunca saiu", () => {
    expect(efeitosDaTransicao("aguardando", "cancelado").devolverEstoque).toBe(false);
  });

  test("salvar sem mudar o status não faz nada, em nenhum status", () => {
    for (const s of TODOS_STATUS) {
      expect(efeitosDaTransicao(s, s)).toEqual({
        baixarEstoque: false,
        contarVenda: false,
        devolverEstoque: false,
      });
    }
  });

  test("em nenhuma transição o estoque baixa e volta ao mesmo tempo", () => {
    for (const a of TODOS_STATUS) {
      for (const d of TODOS_STATUS) {
        const e = efeitosDaTransicao(a, d);
        expect(e.baixarEstoque && e.devolverEstoque).toBe(false);
      }
    }
  });
});
