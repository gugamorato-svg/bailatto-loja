import fs from "node:fs";

// --- 1.1 sacola: o WhatsApp vira suporte, não caminho alternativo de compra ---
const pc = "src/app/carrinho/page.tsx";
let c = fs.readFileSync(pc, "utf8");

const botaoAntigo = `          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-[2px] border border-wine px-6 py-3 text-center text-sm uppercase tracking-wide text-wine hover:bg-wine hover:text-on-wine"
          >
            Prefiro pelo WhatsApp
          </a>`;

const linkNovo = `          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-center text-sm text-text-2 underline decoration-border underline-offset-4 hover:text-wine"
          >
            Dúvida antes de fechar? Chamar no WhatsApp
          </a>`;

if (!c.includes(botaoAntigo)) throw new Error("botao do WhatsApp na sacola nao encontrado");
c = c.replace(botaoAntigo, linkNovo);

// a mensagem também muda: agora é dúvida, não pedido
c = c.replace(
  '    "Olá! Gostaria de finalizar meu pedido na BAILATTO:\n\n" +',
  '    "Olá! Estou vendo estes modelos no site da BAILATTO e fiquei com uma dúvida:\n\n" +'
);
c = c.replace(
  '      "\n\nPode me ajudar?",',
  '      "\n\nPode me ajudar?",'
);
fs.writeFileSync(pc, c);
console.log("1.1 OK — sacola com uma saída só");

// --- 1.2 CPF: deixar claro que é opcional e para quê ---
const pk = "src/app/checkout/page.tsx";
let k = fs.readFileSync(pk, "utf8");

const cpfAntigo = `              <Field label="CPF (para a nota)">
                <input name="cpf" placeholder="000.000.000-00" className={inputCls} />
              </Field>`;

const cpfNovo = `              <Field label="CPF na nota fiscal (opcional)">
                <input name="cpf" placeholder="000.000.000-00" className={inputCls} />
                <span className="mt-1 block text-xs text-text-2">
                  Só usamos para emitir a nota. Pode deixar em branco.
                </span>
              </Field>`;

if (!k.includes(cpfAntigo)) throw new Error("campo de CPF nao encontrado");
k = k.replace(cpfAntigo, cpfNovo);
fs.writeFileSync(pk, k);
console.log("1.2 OK — CPF explicado");
