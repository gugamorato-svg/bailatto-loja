import fs from "node:fs";
const p = "src/lib/frete.ts";
let s = fs.readFileSync(p, "utf8");

const de = `  if (!resposta || !resposta.ok) {
    return { opcoes: [], erro: "Não consegui calcular o frete agora." };
  }`;
const para = `  if (!resposta) {
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
  }`;

if (!s.includes(de)) throw new Error("bloco de erro nao encontrado");
s = s.replace(de, para);
fs.writeFileSync(p, s);
console.log("mensagens de erro melhoradas");
