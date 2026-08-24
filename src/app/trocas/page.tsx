import type { Metadata } from "next";
import { SITE, enderecoCompleto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description:
    "Como trocar ou devolver um calçado comprado na BAILATTO: prazo de 7 dias garantido por lei, troca de numeração e como falar com a gente.",
  alternates: { canonical: "/trocas" },
};

const PERGUNTAS: [string, string][] = [
  [
    "Como eu pago?",
    "Depois de fechar o pedido, o site mostra um QR Code e um código Pix copia e cola já com o valor certo. Você paga pelo app do seu banco e nos manda o comprovante no WhatsApp. Também dá para combinar o pagamento direto com a gente.",
  ],
  [
    "Quanto tempo demora para chegar?",
    "Depende da forma escolhida. Retirada na loja: assim que confirmarmos o pagamento. Entrega em São Carlos: combinamos o melhor horário com você. Envio para outras cidades: o prazo de cada transportadora aparece no momento de calcular o frete.",
  ],
  [
    "E se não servir?",
    "Você tem 7 dias para desistir da compra, contados da entrega. Se for só questão de numeração, fale com a gente — temos loja física e podemos resolver pessoalmente se você for de São Carlos.",
  ],
  [
    "Vocês têm loja física?",
    `Temos. Estamos na ${enderecoCompleto}. Você pode ver e provar o calçado antes de levar.`,
  ],
  [
    "Qual o horário de atendimento?",
    `${SITE.horario.semana} e ${SITE.horario.sabado}.`,
  ],
];

export default function TrocasPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-serif text-3xl text-text">Trocas e devoluções</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-text-2">
        <div>
          <h2 className="font-serif text-xl text-text">
            7 dias para desistir da compra
          </h2>
          <p className="mt-2">
            Compras feitas pela internet têm direito de arrependimento: você pode
            desistir em até <strong className="text-text">7 dias corridos</strong>{" "}
            a partir do recebimento, sem precisar justificar. Esse direito é
            garantido pelo artigo 49 do Código de Defesa do Consumidor.
          </p>
          <p className="mt-2">
            O calçado precisa estar <strong className="text-text">sem uso</strong>,
            com a caixa e as etiquetas como você recebeu. Sapato usado na rua não
            pode ser devolvido — mas experimentar em casa, no chão limpo, é
            exatamente o que você deve fazer.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl text-text">Troca de numeração</h2>
          <p className="mt-2">
            Errou o número? Fale com a gente pelo WhatsApp com o número do seu
            pedido. Se você for de São Carlos, resolvemos na loja — é mais rápido
            e você já experimenta o outro par na hora. Para outras cidades,
            combinamos o envio junto com você.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl text-text">Como pedir</h2>
          <p className="mt-2">
            Chame no WhatsApp{" "}
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wine hover:underline"
            >
              (16) 99339-2022
            </a>{" "}
            informando o <strong className="text-text">número do pedido</strong>{" "}
            (aquele que aparece na tela de confirmação, tipo #1001) e o que
            aconteceu. A gente responde e resolve.
          </p>
        </div>
      </div>

      <h2 className="mt-12 font-serif text-2xl text-text">Perguntas frequentes</h2>
      <div className="mt-4 space-y-2">
        {PERGUNTAS.map(([pergunta, resposta]) => (
          <details
            key={pergunta}
            className="rounded-[2px] border border-border bg-surface"
          >
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-text">
              {pergunta} <span className="float-right text-text-2">＋</span>
            </summary>
            <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-text-2">
              {resposta}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
