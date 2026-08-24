import type { Metadata } from "next";
import Link from "next/link";
import { SITE, enderecoCompleto } from "@/lib/site";
import { StorePhoto } from "@/components/StorePhoto";

export const metadata: Metadata = {
  title: "A loja",
  description:
    "A BAILATTO é uma loja de calçados femininos com loja física em São Carlos-SP. Conheça, venha provar e compre com atendimento de gente de verdade.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-serif text-3xl text-text sm:text-4xl">
        Uma loja de <span className="italic text-wine">verdade</span>, em
        São Carlos
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-text-2">
        <p>
          A BAILATTO é uma loja física de calçados femininos. Fica na{" "}
          <strong className="text-text">{SITE.endereco.rua}</strong>, no{" "}
          {SITE.endereco.bairro}, em São Carlos — você pode entrar, provar com
          calma e conversar com quem
          entende de cada modelo.
        </p>
        <p>
          Este site nasceu para que quem já conhece a loja possa comprar sem sair
          de casa, e para que quem ainda não conhece descubra a gente. Cada foto
          aqui é de um par que está mesmo na loja: nada de catálogo de fábrica ou
          imagem de banco. A numeração que aparece disponível é a que temos de
          fato em estoque.
        </p>
        <p>
          O atendimento continua o mesmo do balcão. Ficou em dúvida entre dois
          números? Quer saber se aquele salto é confortável para um dia inteiro?
          Manda mensagem — a gente responde de{" "}
          {SITE.horario.semana.toLowerCase()} e {SITE.horario.sabado.toLowerCase()}.
        </p>
      </div>

      <div className="mt-10">
        <StorePhoto src="/loja.jpg" alt="Fachada da loja BAILATTO em São Carlos" />
      </div>

      <div className="mt-10 rounded-[2px] border border-border bg-surface p-6">
        <h2 className="font-serif text-xl text-text">Venha nos visitar</h2>
        <p className="mt-3 text-text-2">
          {enderecoCompleto}
          <br />
          CEP {SITE.endereco.cep}
        </p>
        <p className="mt-3 text-text-2">
          {SITE.horario.semana}
          <br />
          {SITE.horario.sabado}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[2px] bg-wine px-6 py-3 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
          >
            Chamar no WhatsApp
          </a>
          <a
            href="https://www.google.com/maps/search/?api=1&query=BAILATTO+Cal%C3%A7ados+Rua+Geminiano+Costa+416+S%C3%A3o+Carlos"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[2px] border border-wine px-6 py-3 text-sm uppercase tracking-wide text-wine hover:bg-wine hover:text-on-wine"
          >
            Como chegar
          </a>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-text-2">
        <Link href="/produtos" className="text-wine hover:underline">
          Ver a coleção completa →
        </Link>
      </p>
    </section>
  );
}
