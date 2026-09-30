import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts, getAllProducts } from "@/lib/db";
import { categories } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { StorePhoto } from "@/components/StorePhoto";
import {
  IconeEstrela,
  IconeLoja,
  IconePacote,
  IconeSeta,
  IconeTroca,
} from "@/components/icones";
import { LIMIAR_BASE } from "@/lib/freteGratis";
import { SITE } from "@/lib/site";

const WA = "https://wa.me/5516993392022";
const IG = "https://instagram.com/bailatto.calcados.saocarlos";

export const dynamic = "force-dynamic";

/**
 * Aqui havia três depoimentos inventados. Saíram: declarar como cliente quem
 * não é engana a consumidora, e não se conserta com nome fictício.
 *
 * O espaço agora traz o que é verdade e dá para conferir — endereço real,
 * direito de troca garantido por lei, horário de atendimento. Quando houver
 * avaliação real de cliente, ela entra aqui, com o nome de quem escreveu.
 */
/**
 * Três frases logo abaixo do hero, no lugar da régua de números que estava
 * ali (5,0★ / São Carlos / 211 modelos). Número solto não responde a dúvida
 * de quem nunca comprou aqui: onde fica, e se dá para devolver. Os três são
 * conferíveis — o limiar sai do mesmo módulo que o checkout usa.
 */
const seguranca = [
  {
    Icone: IconeLoja,
    titulo: "Loja física no Centro",
    // O título já diz "no Centro"; sem o "-SP" a linha cabe inteira no celular
    // em vez de quebrar em "São Carlos-" / "SP".
    detalhe: `${SITE.endereco.rua}, ${SITE.endereco.cidade}`,
  },
  {
    Icone: IconeTroca,
    titulo: "7 dias para trocar",
    detalhe: "Direito de arrependimento garantido por lei",
  },
  {
    Icone: IconePacote,
    titulo: `Frete grátis a partir de R$ ${LIMIAR_BASE}`,
    detalhe: "SP, MG, RJ, ES e PR — retirar na loja é sempre grátis",
  },
];

const motivos = [
  {
    titulo: "Experimente antes de levar",
    texto:
      "A loja é física, no Centro de São Carlos. Você prova, anda pela loja e só leva o par que serviu de verdade.",
  },
  {
    titulo: "7 dias para trocar",
    texto:
      "Comprou pela internet e não serviu? O direito de arrependimento é garantido por lei, e a troca é simples: fale com a gente e resolvemos.",
  },
  {
    titulo: "Dúvida de numeração? Pergunte",
    texto:
      "Quem responde no WhatsApp conhece cada modelo e sabe quais calçam menor. De segunda a sexta, 9h às 18h, e sábado até 13h.",
  },
];

export default async function Home() {
  const featured = await getFeaturedProducts();
  const all = await getAllProducts();
  const cats = categories.filter((c) => all.some((p) => p.category === c.slug));

  // Dados estruturados da loja física — é o que alimenta a busca local do Google.
  // Sem a nota do Google: declarar avaliação de terceiro como própria é proibido.
  const negocioJsonLd = {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    name: SITE.nome,
    description: SITE.descricaoCurta,
    url: SITE.url,
    telephone: SITE.telefone,
    image: `${SITE.url}/loja.jpg`,
    priceRange: "R$ 15 - R$ 189",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.endereco.rua,
      addressLocality: SITE.endereco.cidade,
      addressRegion: SITE.endereco.uf,
      postalCode: SITE.endereco.cep,
      addressCountry: SITE.endereco.pais,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "13:00",
      },
    ],
    sameAs: [SITE.instagram, SITE.googleMaps],
    hasMap: SITE.googleMaps,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(negocioJsonLd) }}
      />
      {/* HERO */}
      <section className="border-b border-border bg-bg">
        <div className="mx-auto max-w-[1440px] md:px-5 md:pt-5">
          <div className="overflow-hidden bg-[#261d18]">
            <div className="relative aspect-[3/4] min-h-[520px] overflow-hidden sm:aspect-[4/5] md:aspect-[16/9] md:min-h-[580px] lg:aspect-[16/8] lg:max-h-[760px]">
              <Image
                src="/hero-modelo-bailatto-20260831-v2.webp"
                alt="Modelo BAILATTO caminhando com scarpin vinho em uma boutique"
                fill
                sizes="100vw"
                className="object-cover object-[70%_center] md:object-center"
                priority
              />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-black/70 via-black/30 to-transparent md:block" />
              <div className="absolute inset-0 hidden items-center px-10 md:flex lg:px-20">
                <div className="faixa-escura max-w-[610px] text-white">
                  <h1 className="font-serif text-5xl leading-[0.98] lg:text-[4.5rem]">
                    Elegância que acompanha <span className="italic">cada passo.</span>
                  </h1>
                  <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85">
                    Os scarpins da nova coleção de verão, escolhidos para
                    transformar o essencial em presença — do trabalho aos
                    momentos que pedem algo especial.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center gap-7">
                    <Link
                      href="/produtos?categoria=scarpins"
                      className="btn btn-claro group/cta"
                    >
                      Descobrir os scarpins
                      <IconeSeta
                        tamanho={18}
                        className="transition-transform duration-200 ease-[var(--ease-saida)] group-hover/cta:translate-x-1"
                      />
                    </Link>
                    <a
                      href={WA}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] uppercase tracking-[0.16em] text-white/85 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
                    >
                      Fale com a gente
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg px-5 py-10 md:hidden">
              <h1 className="font-serif text-[2.65rem] leading-[1.02] text-text">
                Elegância que acompanha <span className="italic text-wine">cada passo.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-text-2">
                Os scarpins da nova coleção de verão, escolhidos para transformar
                o essencial em presença.
              </p>
              <Link
                href="/produtos?categoria=scarpins"
                className="btn btn-principal group/cta mt-7 w-full"
              >
                Descobrir os scarpins
                <IconeSeta
                  tamanho={18}
                  className="transition-transform duration-200 ease-[var(--ease-saida)] group-hover/cta:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* O que a cliente quer saber antes de decidir — e cada linha é
              verificável: a loja existe, a troca é lei, o limiar é o que o
              checkout aplica de verdade. */}
          <ul className="grid divide-y divide-border border-x border-b border-border bg-bg sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {seguranca.map((s) => (
              <li key={s.titulo} className="flex items-start gap-3 px-5 py-4">
                <s.Icone tamanho={18} className="mt-0.5 shrink-0 text-wine" />
                <span className="text-sm leading-snug">
                  <span className="block text-text">{s.titulo}</span>
                  <span className="block text-text-2">{s.detalhe}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ENCONTRE O SEU ESTILO */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <h2 className="mb-10 font-serif text-3xl text-text sm:text-4xl">
          Encontre o <span className="italic text-wine">seu</span> estilo
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/produtos?categoria=${c.slug}`}
              className="group flex items-center justify-between border-b border-border py-3 transition-colors duration-200 hover:border-wine"
            >
              <span className="font-serif text-lg text-text transition-colors duration-200 group-hover:text-wine">
                {c.label}
              </span>
              <IconeSeta
                tamanho={17}
                className="text-text-2 transition-[transform,color] duration-200 ease-[var(--ease-saida)] group-hover:translate-x-1 group-hover:text-wine"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* OS QUERIDINHOS DA LOJA */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <div className="mb-12 flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-text sm:text-4xl">
              Os <span className="italic text-wine">queridinhos</span> da loja
            </h2>
            <Link
              href="/produtos"
              className="shrink-0 border-b border-border pb-1 text-[0.7rem] uppercase tracking-[0.18em] text-text-2 transition-colors duration-200 hover:border-wine hover:text-wine"
            >
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE — faixa vinho */}
      <section className="faixa-escura bg-band text-band-text">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-4 py-16 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Feito para quem transforma <span className="italic">cada passo</span>{" "}
              em estilo.
            </h2>
            <p className="mt-5 max-w-xl text-band-text/80">
              Aqui na BAILATTO, cada cliente é única. A gente ama ajudar você a
              encontrar o par perfeito — com atendimento de perto, de quem entende
              de sapato e adora o que faz. Vem nos visitar em São Carlos.
            </p>
          </div>
          {/* A nota do Google aparecia três vezes na mesma página (aqui, no
              alto e no rodapé). Repetir prova social não soma: fica só uma. */}
          <a
            href={SITE.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 self-start border-b border-band-text/25 pb-2 transition-colors duration-200 hover:border-band-text"
          >
            <IconeEstrela tamanho={22} className="shrink-0 text-band-text" />
            <span>
              <span className="block font-serif text-2xl leading-none">5,0 no Google</span>
              <span className="mt-1.5 block text-sm text-band-text/70">
                Ver a ficha da loja
              </span>
            </span>
          </a>
        </div>
      </section>

      {/* POR QUE COMPRAR AQUI */}
      <section className="mx-auto max-w-[1180px] px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl text-text">
            Comprar de quem <span className="italic text-wine">atende</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-2">
            Uma loja de rua, com gente que conhece cada modelo do estoque.
          </p>
        </div>
        {/* Sem caixa: três colunas separadas por um fio, como uma página de
            revista. A borda em volta de cada uma só empilhava retângulo. */}
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
          {motivos.map((m) => (
            <div key={m.titulo} className="border-t border-border pt-5">
              <h3 className="font-serif text-lg text-text">{m.titulo}</h3>
              <p className="mt-3 leading-relaxed text-text-2">{m.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VISITE A LOJA (com foto) */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-16 md:grid-cols-2">
          <StorePhoto src="/loja.jpg" alt="Loja BAILATTO no Centro de São Carlos-SP" />
          <div>
            <h2 className="font-serif text-3xl text-text">
              A gente te espera em{" "}
              <span className="italic text-wine">São Carlos</span>
            </h2>
            <p className="mt-4 text-text-2">
              Rua Geminiano Costa, 416 — Centro, São Carlos-SP. Venha experimentar
              com calma e conte com o nosso atendimento pertinho de você.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-principal"
              >
                WhatsApp (16) 99339-2022
              </a>
              {/* Era uma busca montada à mão, com a rua escrita errada
                  ("Germiniano"). Agora aponta para a ficha real do Google. */}
              <a
                href={SITE.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-contorno"
              >
                Como chegar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="mx-auto max-w-[1180px] px-4 py-16 text-center">
        <h2 className="font-serif text-3xl text-text">
          Acompanhe no <span className="italic text-wine">Instagram</span>
        </h2>
        <p className="mt-3 text-text-2">
          Novidades, looks e as peças que acabaram de chegar.
        </p>
        <a
          href={IG}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-principal mt-6"
        >
          @bailatto.calcados.saocarlos
        </a>
      </section>

      {/* CTA FINAL — faixa vinho */}
      <section className="faixa-escura bg-band text-band-text">
        <div className="mx-auto max-w-[1180px] px-4 py-16 text-center">
          <h2 className="font-serif text-4xl">Vem pra BAILATTO.</h2>
          <p className="mx-auto mt-3 max-w-md text-band-text/80">
            O seu próximo par favorito está te esperando.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/produtos" className="btn btn-claro">
              Ver a coleção
            </Link>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-fantasma"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
