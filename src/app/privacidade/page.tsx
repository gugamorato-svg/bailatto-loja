import type { Metadata } from "next";
import { SITE, enderecoCompleto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Quais dados a BAILATTO Calçados coleta ao receber um pedido, para que servem e como pedir a exclusão.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-serif text-3xl text-text">Privacidade</h1>
      <p className="mt-3 text-sm text-text-2">
        Em resumo: pedimos só o necessário para entregar o seu pedido, e não
        vendemos nem compartilhamos os seus dados com ninguém.
      </p>

      <div className="mt-8 space-y-6 leading-relaxed text-text-2">
        <div>
          <h2 className="font-serif text-xl text-text">O que guardamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-text">Nome e WhatsApp</strong> — para falar
              com você sobre o pedido.
            </li>
            <li>
              <strong className="text-text">E-mail</strong> (se você informar) —
              para enviar a confirmação.
            </li>
            <li>
              <strong className="text-text">CPF</strong> (opcional) — usado só se
              você quiser a nota fiscal em seu nome.
            </li>
            <li>
              <strong className="text-text">Endereço e CEP</strong> — para calcular
              o frete e entregar.
            </li>
            <li>
              <strong className="text-text">Itens do pedido</strong> — o que você
              comprou, para separarmos corretamente.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl text-text">Para que usamos</h2>
          <p className="mt-2">
            Exclusivamente para processar, combinar e entregar o seu pedido, e
            para atender você depois da compra. Não usamos seus dados para
            publicidade nem repassamos para terceiros com essa finalidade.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl text-text">Com quem compartilhamos</h2>
          <p className="mt-2">
            Só com quem precisa para a entrega acontecer: a transportadora
            escolhida por você (Correios, Jadlog ou Loggi) recebe o endereço, e o
            serviço que hospeda o site guarda os dados do pedido de forma segura.
            Pagamentos por Pix acontecem direto entre o seu banco e o nosso — não
            temos acesso aos seus dados bancários.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl text-text">Seus direitos</h2>
          <p className="mt-2">
            Pela LGPD você pode pedir a qualquer momento para ver, corrigir ou
            apagar os seus dados. É só mandar mensagem no WhatsApp{" "}
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wine hover:underline"
            >
              (16) 99339-2022
            </a>
            . A gente resolve — sem burocracia.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl text-text">Quem somos</h2>
          <p className="mt-2">
            BAILATTO Calçados — CNPJ 62.086.144/0001-60
            <br />
            {enderecoCompleto}, CEP {SITE.endereco.cep}
          </p>
        </div>
      </div>
    </section>
  );
}
