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

const depoimentos = [
  {
    name: "Ana P.",
    text: "Fui super bem atendida e amei o sapato! Confortável de verdade e ainda por cima chique. Já virei cliente.",
  },
  {
    name: "Marina S.",
    text: "A loja é um charme e as meninas ajudam a escolher com toda a paciência. Saí de lá apaixonada pela minha sandália.",
  },
  {
    name: "Juliana R.",
    text: "Qualidade ótima e preço justo. Comprei pra um casamento e recebi um monte de elogios!",
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
    priceRange: "R$ 79 - R$ 249",
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
    sameAs: [SITE.instagram],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(negocioJsonLd) }}
      />
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1240px] items-center md:grid-cols-[1.05fr_1fr]">
          <div className="px-5 py-16 sm:py-20 md:px-14">
            <p className="text-[0.66rem] uppercase tracking-[0.28em] text-text-2">
              Nova coleção · Verão 2026
            </p>
            <h1 className="mt-6 font-serif text-[2.7rem] leading-[1.04] text-text sm:text-6xl">
              O par certo <span className="italic text-wine">combina</span> com
              você.
            </h1>
            <p className="mt-6 max-w-md text-text-2">
              Calçados femininos escolhidos a dedo, do trabalho à festa. Retirada
              grátis em São Carlos ou entrega para todo o Brasil.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-7">
              <Link
                href="/produtos"
                className="border-b border-text pb-1.5 text-[0.72rem] uppercase tracking-[0.2em] text-text transition-colors hover:border-wine hover:text-wine"
              >
                Ver a coleção
              </Link>
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-transparent pb-1.5 text-[0.72rem] uppercase tracking-[0.2em] text-text-2 transition-colors hover:border-wine hover:text-wine"
              >
                Falar no WhatsApp
              </a>
            </div>
            <div className="mt-12 flex gap-10 border-t border-border pt-7 text-sm">
              <div>
                <p className="font-serif text-xl text-wine">5,0★</p>
                <p className="text-[0.72rem] uppercase tracking-[0.12em] text-text-2">no Google</p>
              </div>
              <div>
                <p className="font-serif text-xl text-text">São Carlos</p>
                <p className="text-[0.72rem] uppercase tracking-[0.12em] text-text-2">loja física</p>
              </div>
              <div>
                <p className="font-serif text-xl text-text">151</p>
                <p className="text-[0.72rem] uppercase tracking-[0.12em] text-text-2">modelos</p>
              </div>
            </div>
          </div>

          <div className="relative hidden aspect-[4/5] overflow-hidden bg-surface-2 md:block">
            <Image
              src="/hero.jpg"
              alt="Calçados em destaque na loja BAILATTO"
              fill
              sizes="(max-width: 768px) 0px, 560px"
              className="object-cover"
              priority
            />
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

      {/* DEPOIMENTOS */}
      <section className="mx-auto max-w-[1180px] px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl text-text">
            Quem usa, <span className="italic text-wine">recomenda</span>
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-2xl leading-none text-wine">★★★★★</span>
            <span className="font-serif text-2xl text-text">5,0</span>
            <span className="text-text-2">no Google · 3 avaliações</span>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {depoimentos.map((t) => (
            <figure
              key={t.name}
              className="rounded-[2px] border border-border bg-surface p-6"
            >
              <div className="leading-none text-wine">★★★★★</div>
              <blockquote className="mt-3 text-text-2">{t.text}</blockquote>
              <figcaption className="mt-4 text-sm font-medium text-text">
                — {t.name}
              </figcaption>
            </figure>
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
