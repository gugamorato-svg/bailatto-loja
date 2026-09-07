import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts, getAllProducts } from "@/lib/db";
import { categories } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { StorePhoto } from "@/components/StorePhoto";
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
                <div className="max-w-[610px] text-white">
                  <p className="text-[0.68rem] uppercase tracking-[0.3em] text-white/80">
                    Nova coleção · Verão 2026
                  </p>
                  <h1 className="mt-6 font-serif text-5xl leading-[0.98] lg:text-[4.5rem]">
                    Elegância que acompanha <span className="italic">cada passo.</span>
                  </h1>
                  <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85">
                    Scarpins escolhidos para transformar o essencial em presença —
                    do trabalho aos momentos que pedem algo especial.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center gap-7">
                    <Link
                      href="/produtos?categoria=scarpins"
                      className="inline-flex h-12 items-center justify-center rounded-[2px] bg-white px-9 text-[0.72rem] uppercase tracking-[0.2em] text-[#1a1613] transition-colors hover:bg-[#f4f0ea]"
                    >
                      Descobrir os scarpins <span className="ml-3 text-lg">→</span>
                    </Link>
                    <a
                      href={WA}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] uppercase tracking-[0.16em] text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
                    >
                      Fale com a gente
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg px-5 py-10 md:hidden">
              <p className="text-[0.66rem] uppercase tracking-[0.28em] text-text-2">
                Nova coleção · Verão 2026
              </p>
              <h1 className="mt-4 font-serif text-[2.65rem] leading-[1.02] text-text">
                Elegância que acompanha <span className="italic text-wine">cada passo.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-text-2">
                Scarpins escolhidos para transformar o essencial em presença — do
                trabalho aos momentos especiais.
              </p>
              <Link
                href="/produtos?categoria=scarpins"
                className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-[2px] bg-wine px-6 text-[0.7rem] uppercase tracking-[0.18em] text-on-wine transition-colors hover:bg-wine-2"
              >
                Descobrir os scarpins <span className="ml-3 text-lg">→</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 border-x border-border bg-bg text-center">
            <div className="border-r border-border px-2 py-5">
              <p className="font-serif text-lg text-wine sm:text-xl">5,0★</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-text-2 sm:text-[0.68rem]">
                no Google
              </p>
            </div>
            <div className="border-r border-border px-2 py-5">
              <p className="font-serif text-lg text-text sm:text-xl">São Carlos</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-text-2 sm:text-[0.68rem]">
                loja física
              </p>
            </div>
            <div className="px-2 py-5">
              <p className="font-serif text-lg text-text sm:text-xl">{all.length}</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-text-2 sm:text-[0.68rem]">
                modelos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ENCONTRE O SEU ESTILO */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <p className="text-[0.66rem] uppercase tracking-[0.28em] text-text-2">
          Categorias
        </p>
        <h2 className="mb-10 mt-3 font-serif text-3xl text-text sm:text-4xl">
          Encontre o <span className="italic text-wine">seu</span> estilo
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/produtos?categoria=${c.slug}`}
              className="group flex items-center justify-between border-b border-border py-3 transition-colors hover:border-wine"
            >
              <span className="font-serif text-lg text-text transition-colors group-hover:text-wine">
                {c.label}
              </span>
              <span className="text-text-2 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* OS QUERIDINHOS DA LOJA */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.28em] text-text-2">
                Seleção
              </p>
              <h2 className="mt-3 font-serif text-3xl text-text sm:text-4xl">
                Os <span className="italic text-wine">queridinhos</span> da loja
              </h2>
            </div>
            <Link
              href="/produtos"
              className="shrink-0 border-b border-border pb-1 text-[0.7rem] uppercase tracking-[0.18em] text-text-2 transition-colors hover:border-wine hover:text-wine"
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
      <section className="bg-band text-band-text">
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
          <div className="flex gap-8">
            <div>
              <p className="font-serif text-2xl">5,0★</p>
              <p className="text-sm text-band-text/70">no Google</p>
            </div>
            <div>
              <p className="font-serif text-2xl">São Carlos</p>
              <p className="text-sm text-band-text/70">SP</p>
            </div>
            <div>
              <p className="font-serif text-2xl">Pessoal</p>
              <p className="text-sm text-band-text/70">atendimento</p>
            </div>
          </div>
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
        <div className="grid gap-6 md:grid-cols-3">
          {motivos.map((m) => (
            <div
              key={m.titulo}
              className="rounded-[2px] border border-border bg-surface p-6"
            >
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
                className="rounded-[2px] bg-wine px-6 py-3 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
              >
                WhatsApp (16) 99339-2022
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=BAILATTO+Cal%C3%A7ados+Rua+Germiniano+Costa+416+S%C3%A3o+Carlos"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[2px] border border-wine px-6 py-3 text-sm font-medium uppercase tracking-wide text-wine hover:bg-wine hover:text-on-wine"
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
          className="mt-6 inline-block rounded-[2px] bg-wine px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          @bailatto.calcados.saocarlos
        </a>
      </section>

      {/* CTA FINAL — faixa vinho */}
      <section className="bg-band text-band-text">
        <div className="mx-auto max-w-[1180px] px-4 py-16 text-center">
          <h2 className="font-serif text-4xl">Vem pra BAILATTO.</h2>
          <p className="mx-auto mt-3 max-w-md text-band-text/80">
            O seu próximo par favorito está te esperando.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/produtos"
              className="rounded-[2px] bg-on-wine px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-band transition-opacity hover:opacity-90"
            >
              Ver a coleção
            </Link>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[2px] border border-band-text/40 px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-band-text transition-colors hover:bg-band-text/10"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
