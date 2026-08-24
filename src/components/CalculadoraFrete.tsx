"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type Opcao = { id: string; nome: string; preco: number; prazoDias: number };

/**
 * Frete na própria página do produto. Descobrir o custo só no fim do checkout
 * é a maior causa de abandono — e, como boa parte das clientes é da cidade,
 * "retirada grátis" precisa aparecer antes de qualquer valor.
 */
export function CalculadoraFrete() {
  const [cep, setCep] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [erro, setErro] = useState("");
  const [calculando, setCalculando] = useState(false);

  async function calcular(e: React.FormEvent) {
    e.preventDefault();
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) {
      setErro("Digite o CEP completo, com 8 números.");
      setOpcoes([]);
      return;
    }
    setCalculando(true);
    setErro("");
    setOpcoes([]);
    try {
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: limpo, pares: 1 }),
      });
      const d = await r.json();
      if (d.erro || !d.opcoes?.length) {
        setErro(d.erro || "Nenhuma opção de envio para esse CEP.");
      } else {
        setOpcoes(d.opcoes);
      }
    } catch {
      setErro("Não consegui calcular agora. Tente de novo em instantes.");
    }
    setCalculando(false);
  }

  return (
    <div className="mt-8 rounded-[2px] border border-border bg-surface p-5">
      <p className="text-sm text-text">
        <strong>Retirada grátis na loja</strong>{" "}
        <span className="text-text-2">— Centro, São Carlos</span>
      </p>
      <p className="mt-1 text-sm text-text">
        <strong>Entrega em São Carlos: R$ 10,00</strong>
      </p>

      <form onSubmit={calcular} className="mt-4 border-t border-border pt-4">
        <label className="block text-sm font-medium text-text" htmlFor="cep-frete">
          Mora em outra cidade? Calcule o frete
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="cep-frete"
            inputMode="numeric"
            placeholder="Seu CEP"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            className="w-40 rounded-[2px] border border-border bg-bg px-3 py-2 text-text outline-none focus:border-wine"
          />
          <button
            type="submit"
            disabled={calculando}
            className="rounded-[2px] border border-wine px-4 py-2 text-sm text-wine transition-colors hover:bg-wine hover:text-on-wine disabled:opacity-60"
          >
            {calculando ? "Calculando…" : "Calcular"}
          </button>
        </div>
      </form>

      {erro && <p className="mt-3 text-sm text-wine">{erro}</p>}

      {opcoes.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {opcoes.map((o) => (
            <li key={o.id} className="flex justify-between gap-3 text-text-2">
              <span>
                {o.nome}
                {o.prazoDias > 0 && ` — até ${o.prazoDias} dia(s) úteis`}
              </span>
              <span className="shrink-0 text-wine">{formatPrice(o.preco)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
