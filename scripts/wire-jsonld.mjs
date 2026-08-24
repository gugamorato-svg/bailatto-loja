import fs from "node:fs";
const p = "src/app/page.tsx";
let s = fs.readFileSync(p, "utf8");

if (!s.includes("SITE")) {
  s = s.replace(
    'import { StorePhoto } from "@/components/StorePhoto";',
    'import { StorePhoto } from "@/components/StorePhoto";\nimport { SITE } from "@/lib/site";'
  );
}

const marcador = "  return (\n    <>\n      {/* HERO */}";
const jsonld = `  // Dados estruturados da loja física — é o que alimenta a busca local do Google.
  // Sem horário de funcionamento (ainda não confirmado) e sem a nota do Google:
  // declarar avaliação de terceiro como própria é proibido pelo Google.
  const negocioJsonLd = {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    name: SITE.nome,
    description: SITE.descricaoCurta,
    url: SITE.url,
    telephone: SITE.telefone,
    image: \`\${SITE.url}/loja.jpg\`,
    priceRange: "R$ 79 - R$ 249",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.endereco.rua,
      addressLocality: SITE.endereco.cidade,
      addressRegion: SITE.endereco.uf,
      postalCode: SITE.endereco.cep,
      addressCountry: SITE.endereco.pais,
    },
    sameAs: [SITE.instagram],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(negocioJsonLd) }}
      />
      {/* HERO */}`;

if (!s.includes(marcador)) throw new Error("marcador do return nao encontrado");
s = s.replace(marcador, jsonld);
fs.writeFileSync(p, s);
console.log("JSON-LD da loja adicionado na home");
