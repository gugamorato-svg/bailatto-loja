import { categories, type CategorySlug } from "./products";

/**
 * Texto próprio de cada categoria. Sem isso as 13 URLs de
 * /produtos?categoria=... compartilhavam title, description, H1 e canonical —
 * ou seja, o site dizia ao Google que eram todas a mesma página, e nenhuma
 * ranqueava para "scarpin feminino", "bota feminina" e afins.
 *
 * O texto tem de ser único de verdade: description repetida com a keyword
 * trocada não resolve nada.
 */
type Texto = { h1: string; title: string; description: string; intro: string };

const CIDADE = "São Carlos-SP";
const ENTREGA = `Retirada grátis em ${CIDADE} ou entrega para todo o Brasil.`;

export const TEXTOS: Partial<Record<CategorySlug, Texto>> = {
  scarpins: {
    h1: "Scarpins",
    title: "Scarpin Feminino — Salto Alto, Baixo e Bico Fino",
    description: `Scarpins femininos de salto alto, baixo e bloco, em verniz, napa e camurça. Veja preço e numeração disponível. ${ENTREGA}`,
    intro: "O scarpin é o sapato que resolve o dia inteiro: reunião, jantar, casamento. Aqui você acha do bico fino clássico ao salto bloco de andar o dia todo, com numeração do 33 ao 40.",
  },
  sandalias: {
    h1: "Sandálias",
    title: "Sandália Feminina — Salto, Tiras e Festa",
    description: `Sandálias femininas de salto fino, bloco e taça, com tiras, strass e modelos de festa. ${ENTREGA}`,
    intro: "De tira fina para a noite ao salto bloco que aguenta a festa inteira. As sandálias de strass são as mais procuradas para casamento e formatura.",
  },
  rasteirinhas: {
    h1: "Rasteirinhas",
    title: "Rasteirinha Feminina — Confortável para o Dia a Dia",
    description: `Rasteirinhas femininas leves e confortáveis, lisas e com aplicação. Combinam com short, vestido e jeans. ${ENTREGA}`,
    intro: "A rasteirinha é o par de andar muito sem pensar no pé. Modelos lisos para o trabalho e com brilho para sair, todos com solado macio.",
  },
  chinelos: {
    h1: "Chinelos",
    title: "Chinelo Feminino — Slide e Tiras com Brilho",
    description: `Chinelos femininos slide, lisos e com brilho, para o calor e para andar em casa ou na rua. ${ENTREGA}`,
    intro: "Chinelo que dá para usar fora de casa sem parecer chinelo de casa. Slide de tira larga, acabamento caprichado e conforto imediato.",
  },
  botas: {
    h1: "Botas",
    title: "Bota Feminina — Cano Curto, Salto Bloco e Couro",
    description: `Botas femininas de cano curto e médio, salto bloco, em napa, suede e croco. ${ENTREGA}`,
    intro: "Bota é investimento de estação: dura, combina com tudo e resolve o inverno. Cano curto e médio, com salto bloco firme para o dia inteiro.",
  },
  mocassins: {
    h1: "Mocassins",
    title: "Mocassim Feminino — Confortável para Trabalhar",
    description: `Mocassins femininos com fivela e bico fino, em napa. O sapato fechado de andar o dia todo. ${ENTREGA}`,
    intro: "O mocassim é o sapato fechado que não aperta. Vai de calça de alfaiataria a jeans, e é o preferido de quem passa o dia em pé.",
  },
  sapatilhas: {
    h1: "Sapatilhas",
    title: "Sapatilha Feminina — Bico Fino e Laço",
    description: `Sapatilhas femininas de bico fino, com laço e detalhes metalizados. Sem salto, com conforto. ${ENTREGA}`,
    intro: "Sapatilha para quem quer o pé arrumado sem salto nenhum. Bico fino alonga a perna e o solado é flexível desde o primeiro uso.",
  },
  tamancos: {
    h1: "Tamancos",
    title: "Tamanco Feminino — Salto Bloco e Plataforma",
    description: `Tamancos femininos de salto bloco e plataforma, com fivela. Altura com estabilidade. ${ENTREGA}`,
    intro: "O tamanco dá altura sem o desequilíbrio do salto fino. Base larga, apoio firme e aquele ar retrô que vem voltando toda temporada.",
  },
  papete: {
    h1: "Papete",
    title: "Papete Feminina — Tiras e Solado Tratorado",
    description: `Papetes femininas de tiras ajustáveis e solado tratorado, com strass. Conforto de andar muito. ${ENTREGA}`,
    intro: "Papete é a sandália de andar sem hora para voltar. Tiras que ajustam ao pé e solado alto que absorve o impacto do asfalto.",
  },
  tenis: {
    h1: "Tênis",
    title: "Tênis Feminino Casual — Retrô e Off-White",
    description: `Tênis femininos casuais, modelos retrô e plataforma, em tons neutros. ${ENTREGA}`,
    intro: "Tênis casual para compor look, não para treinar. Modelos retrô em tons neutros que combinam com vestido, saia e alfaiataria.",
  },
  mules: {
    h1: "Chanel",
    title: "Sapato Chanel Feminino — Bico Fino e Salto",
    description: `Sapatos estilo Chanel femininos, de bico fino e salto, em cores lisas e bicolores. ${ENTREGA}`,
    intro: "O Chanel é o meio-termo entre a sapatilha e o scarpin: tem salto, mas baixo, e o bico fino deixa o pé elegante sem cansar.",
  },
  semijoias: {
    h1: "Semijoias",
    title: "Semijoias Folheadas — Brincos, Conjuntos e Tornozeleiras",
    description: `Semijoias folheadas a ouro e prata: brincos, conjuntos com colar e tornozeleiras, a partir de R$ 15. Peças únicas. ${ENTREGA}`,
    intro: "Peças folheadas escolhidas uma a uma — a maior parte tem só uma unidade de cada modelo. Brincos a partir de R$ 15, ótimos para presentear.",
  },
  acessorios: {
    h1: "Acessórios",
    title: "Acessórios Femininos — Bolsas, Carteiras e Lenços",
    description: `Bolsas, carteiras, nécessaires e lenços de cetim femininos, a partir de R$ 19,90. ${ENTREGA}`,
    intro: "O que completa o look e cabe na bolsa: carteira, nécessaire de viagem, lenço de cetim e bolsas para o dia e para a noite.",
  },
};

const PADRAO: Texto = {
  h1: "Nossa Coleção",
  title: "Nossa Coleção — calçados, semijoias e acessórios femininos",
  description: `Scarpins, sandálias, sapatilhas, mocassins, botas, rasteirinhas, papetes e tamancos, além de semijoias e acessórios. ${ENTREGA}`,
  intro: "",
};

/** Categoria válida vinda da URL, ou null quando é "todos" ou lixo. */
export function categoriaDaUrl(v: string | string[] | undefined): CategorySlug | null {
  if (typeof v !== "string" || v === "todos") return null;
  return categories.some((c) => c.slug === v) ? (v as CategorySlug) : null;
}

export function textoDaCategoria(slug: CategorySlug | null): Texto {
  return (slug && TEXTOS[slug]) || PADRAO;
}
