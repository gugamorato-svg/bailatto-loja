import "server-only";

/**
 * Cotação de frete via SuperFrete.
 * O token nunca sai do servidor — o checkout consulta pela rota /api/frete.
 */

export type OpcaoFrete = {
  id: string;
  nome: string;
  empresa: string;
  preco: number;
  prazoDias: number;
};

const SERVICOS = "1,2,17,3,31"; // PAC, SEDEX, Mini Envios, Jadlog, Loggi

function base(): string {
  return process.env.SUPERFRETE_AMBIENTE === "producao"
    ? "https://api.superfrete.com"
    : "https://sandbox.superfrete.com";
}

export function fretePorCepDisponivel(): boolean {
  return !!process.env.SUPERFRETE_TOKEN && !!process.env.LOJA_CEP_ORIGEM;
}

/**
 * Caixa de um par. O peso de 0,75 kg é o mesmo cadastrado nos anúncios do
 * TikTok Shop — antes o site usava 0,9 kg e cobrava frete diferente do
 * marketplace para o mesmo produto. Pares adicionais empilham.
 */
export function calcularPacote(pares: number) {
  const n = Math.max(1, pares);
  return { height: 12 * n, width: 22, length: 33, weight: 0.75 * n };
}

type RespostaServico = {
  id?: number | string;
  name?: string;
  price?: number | string;
  delivery_time?: number | string;
  company?: { name?: string };
  error?: string;
};

/** Consulta as opções de envio. Devolve [] quando não há cotação possível. */
export async function cotarFrete(
  cepDestino: string,
  pares: number,
): Promise<{ opcoes: OpcaoFrete[]; erro?: string }> {
  const token = process.env.SUPERFRETE_TOKEN;
  const origem = process.env.LOJA_CEP_ORIGEM;
  if (!token || !origem) return { opcoes: [], erro: "Frete não configurado." };

  const destino = cepDestino.replace(/\D/g, "");
  if (destino.length !== 8) return { opcoes: [], erro: "CEP inválido." };

  const body = {
    from: { postal_code: origem },
    to: { postal_code: destino },
    services: SERVICOS,
    options: {
      own_hand: false,
      receipt: false,
      insurance_value: 0,
      use_insurance_value: false,
    },
    package: calcularPacote(pares),
  };

  // A API às vezes recusa a primeira conexão; uma retentativa resolve.
  let resposta: Response | undefined;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      resposta = await fetch(`${base()}/api/v0/calculator`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "BAILATTO Calcados (contato@bailatto.com.br)",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      break;
    } catch {
      if (tentativa === 3) return { opcoes: [], erro: "Serviço de frete indisponível." };
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  if (!resposta) {
    return { opcoes: [], erro: "Serviço de frete indisponível." };
  }

  if (!resposta.ok) {
    // A API devolve 400 com o motivo — vale traduzir para algo útil à cliente.
    let motivo = "";
    try {
      motivo = JSON.stringify((await resposta.json())?.errors ?? {});
    } catch {
      // sem corpo legível
    }
    if (/postcode|postal|cep/i.test(motivo)) {
      return { opcoes: [], erro: "CEP não encontrado. Confira o número digitado." };
    }
    if (/no_result|nenhum frete/i.test(motivo)) {
      return {
        opcoes: [],
        erro: "Nenhuma transportadora atende esse CEP. Fale com a gente no WhatsApp.",
      };
    }
    return { opcoes: [], erro: "Não consegui calcular o frete agora." };
  }

  let dados: unknown;
  try {
    dados = await resposta.json();
  } catch {
    return { opcoes: [], erro: "Resposta inesperada do serviço de frete." };
  }
  if (!Array.isArray(dados)) return { opcoes: [], erro: "Nenhuma opção disponível." };

  const opcoes: OpcaoFrete[] = [];
  for (const s of dados as RespostaServico[]) {
    if (s.error) continue;
    const preco = typeof s.price === "string" ? Number(s.price) : s.price;
    const prazo = typeof s.delivery_time === "string" ? Number(s.delivery_time) : s.delivery_time;
    if (!Number.isFinite(preco as number) || !s.name) continue;
    opcoes.push({
      id: String(s.id ?? s.name),
      nome: String(s.name),
      empresa: s.company?.name ?? "",
      preco: Number(preco),
      prazoDias: Number.isFinite(prazo as number) ? Number(prazo) : 0,
    });
  }

  opcoes.sort((a, b) => a.preco - b.preco);
  return { opcoes };
}
