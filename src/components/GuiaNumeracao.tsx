import { SITE } from "@/lib/site";

/** Medidas em cm que correspondem a cada numeração brasileira. */
const TABELA: [number, string][] = [
  [33, "21,3 cm"],
  [34, "22,0 cm"],
  [35, "22,7 cm"],
  [36, "23,3 cm"],
  [37, "24,0 cm"],
  [38, "24,7 cm"],
  [39, "25,3 cm"],
  [40, "26,0 cm"],
];

/**
 * Dúvida de tamanho é o abandono nº 1 em calçado. Empurrar isso para o WhatsApp
 * não resolve: a maioria não pergunta, só fecha a aba.
 */
export function GuiaNumeracao({
  nomeProduto,
  numeracoes,
}: {
  nomeProduto: string;
  numeracoes: number[];
}) {
  const n = nomeProduto.toLowerCase();

  // A dica sai do próprio modelo — nada de afirmação genérica sobre caimento.
  let dica: string | null = null;
  if (n.includes("bico fino") || n.includes("scarpin"))
    dica = "Bico fino: se você fica entre dois números, prefira o maior.";
  else if (n.includes("rasteira") || n.includes("papete") || n.includes("tamanco"))
    dica = "Modelo aberto: costuma acomodar bem quem está entre dois números.";
  else if (n.includes("bota"))
    dica = "Bota fechada: se usar meia mais grossa, considere o número maior.";

  const disponiveis = new Set(numeracoes);

  return (
    <details className="mt-6 rounded-[2px] border border-border bg-surface">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-text">
        Qual é a minha numeração? <span className="float-right text-text-2">＋</span>
      </summary>

      <div className="border-t border-border px-5 py-4 text-sm text-text-2">
        <p>
          Pise numa folha de papel, marque o calcanhar e a ponta do dedão, meça a
          distância em centímetros e compare aqui:
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          {TABELA.map(([num, cm]) => (
            <li
              key={num}
              className={
                disponiveis.has(num)
                  ? "flex justify-between text-text"
                  : "flex justify-between opacity-40"
              }
            >
              <span>{num}</span>
              <span>{cm}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          Em cinza claro, as numerações que não temos deste modelo.
        </p>

        {dica && <p className="mt-4 text-text">{dica}</p>}

        <p className="mt-4">
          Na dúvida,{" "}
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wine hover:underline"
          >
            manda uma mensagem
          </a>{" "}
          — a gente conhece cada modelo. Atendemos {SITE.horario.semana.toLowerCase()} e{" "}
          {SITE.horario.sabado.toLowerCase()}.
        </p>
      </div>
    </details>
  );
}
