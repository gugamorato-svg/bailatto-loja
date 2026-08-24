import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-band text-band-text">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-serif text-2xl tracking-[0.25em]">BAILATTO</p>
          <p className="mt-3 max-w-xs text-sm text-band-text/80">
            Calçados femininos que traduzem elegância e desejo, com atendimento
            pessoal e olhar de boutique.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-lg">Navegação</h3>
          <ul className="mt-4 space-y-2 text-sm text-band-text/80">
            <li>
              <Link href="/" className="hover:text-band-text">
                Início
              </Link>
            </li>
            <li>
              <Link href="/produtos" className="hover:text-band-text">
                Produtos
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:text-band-text">
                A loja
              </Link>
            </li>
            <li>
              <Link href="/trocas" className="hover:text-band-text">
                Trocas e devoluções
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-band-text">
                Privacidade
              </Link>
            </li>
            <li>
              <Link href="/carrinho" className="hover:text-band-text">
                Sacola
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-lg">Contato &amp; Visita</h3>
          <ul className="mt-4 space-y-2 text-sm text-band-text/80">
            <li>
              {SITE.endereco.rua} — {SITE.endereco.bairro}
              <br />
              {SITE.endereco.cidade} - {SITE.endereco.uf}, CEP {SITE.endereco.cep}
            </li>
            <li>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-band-text"
              >
                WhatsApp (16) 99339-2022
              </a>
            </li>
            <li>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-band-text"
              >
                @bailatto.calcados.saocarlos
              </a>
            </li>
            <li>
              {SITE.horario.semana}
              <br />
              {SITE.horario.sabado}
            </li>
            <li>★ 5,0 no Google</li>
          </ul>
        </div>
      </div>

      {/* Identificação legal: é o sinal de legitimidade mais barato que existe —
          e é exatamente o que uma cliente desconfiada procura antes de pagar. */}
      <div className="border-t border-band-text/15">
        <div className="mx-auto max-w-[1180px] px-4 py-6 text-xs text-band-text/60">
          <p>
            BAILATTO Calçados · CNPJ 62.086.144/0001-60 · {SITE.endereco.rua} —{" "}
            {SITE.endereco.bairro}, {SITE.endereco.cidade}-{SITE.endereco.uf}, CEP{" "}
            {SITE.endereco.cep} · Telefone (16) 99339-2022
          </p>
          <p className="mt-2">© 2026 BAILATTO Calçados. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
