import fs from "node:fs";
const p = "src/app/checkout/page.tsx";
let s = fs.readFileSync(p, "utf8");

// 1) estado das opcoes de frete
s = s.replace(
  "  const [buscando, setBuscando] = useState(false);",
  `  const [buscando, setBuscando] = useState(false);
  const [opcoes, setOpcoes] = useState<
    { id: string; nome: string; preco: number; prazoDias: number }[]
  >([]);
  const [servico, setServico] = useState("");
  const [cotando, setCotando] = useState(false);
  const [erroFrete, setErroFrete] = useState("");`
);

// 2) frete escolhido entra na conta
s = s.replace(
  "  const frete = FRETE[metodo];",
  `  const opcaoEscolhida = opcoes.find((o) => o.id === servico);
  const frete =
    metodo === "correios" ? opcaoEscolhida?.preco ?? null : FRETE[metodo];`
);

// 3) cotar ao encontrar o CEP
s = s.replace(
  `  async function buscarCep(valor: string) {`,
  `  async function cotarFrete(cepLimpo: string) {
    setCotando(true);
    setErroFrete("");
    setOpcoes([]);
    setServico("");
    try {
      const pares = items.reduce((s, i) => s + i.qty, 0);
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cepLimpo, pares }),
      });
      const d = await r.json();
      if (d.erro || !d.opcoes?.length) {
        setErroFrete(d.erro || "Nenhuma opção de envio para esse CEP.");
      } else {
        setOpcoes(d.opcoes);
        setServico(d.opcoes[0].id);
      }
    } catch {
      setErroFrete("Não consegui calcular o frete agora.");
    }
    setCotando(false);
  }

  async function buscarCep(valor: string) {`
);

// dispara a cotacao junto com a busca de endereco
s = s.replace(
  `    setBuscando(false);
  }`,
  `    setBuscando(false);
    if (metodo === "correios") cotarFrete(only);
  }`
);

// 4) lista de opcoes na tela (depois do bloco de endereco)
const marcador = `              </div>
            )}
          </div>
        </div>`;
const comFrete = `              </div>
            )}

            {metodo === "correios" && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-text">
                  Opções de envio
                </h3>
                {cotando && (
                  <p className="text-sm text-text-2">Calculando o frete…</p>
                )}
                {!cotando && erroFrete && (
                  <p className="text-sm text-wine">{erroFrete}</p>
                )}
                {!cotando && !erroFrete && opcoes.length === 0 && (
                  <p className="text-sm text-text-2">
                    Digite o CEP acima para ver as opções de envio.
                  </p>
                )}
                <div className="space-y-2">
                  {opcoes.map((o) => (
                    <label
                      key={o.id}
                      className={
                        "flex cursor-pointer items-center justify-between gap-3 rounded-[2px] border p-3 transition-colors " +
                        (servico === o.id ? "border-wine bg-surface" : "border-border")
                      }
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="servicoFrete"
                          value={o.id}
                          checked={servico === o.id}
                          onChange={() => setServico(o.id)}
                        />
                        <span>
                          <span className="block text-text">{o.nome}</span>
                          <span className="block text-sm text-text-2">
                            {o.prazoDias > 0
                              ? \`chega em até \${o.prazoDias} dia(s) úteis\`
                              : "prazo a confirmar"}
                          </span>
                        </span>
                      </span>
                      <span className="text-wine">{formatPrice(o.preco)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>`;
if (!s.includes(marcador)) throw new Error("marcador do bloco de entrega nao encontrado");
s = s.replace(marcador, comFrete);

fs.writeFileSync(p, s);
console.log("checkout com frete OK");
