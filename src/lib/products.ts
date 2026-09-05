// Catálogo BAILATTO — 28 produtos (gerado a partir do catálogo de fotos).
// Preços: null = "a confirmar" (aguardando a lista de preços da loja).
// OBS: as 2 papetes rosé sao modelos DIFERENTES (strass cristal vs dourado).

export type CategorySlug =
  | "scarpins"
  | "sandalias"
  | "chinelos"
  | "botas"
  | "rasteirinhas"
  | "mocassins"
  | "tenis"
  | "mules"
  | "tamancos"
  | "papete"
  | "sapatilhas"
  | "semijoias"
  | "acessorios";

export const categories: { slug: CategorySlug; label: string }[] = [
  { slug: "scarpins", label: "Scarpins" },
  { slug: "sandalias", label: "Sandálias" },
  { slug: "chinelos", label: "Chinelos" },
  { slug: "botas", label: "Botas" },
  { slug: "rasteirinhas", label: "Rasteirinhas" },
  { slug: "mocassins", label: "Mocassins" },
  { slug: "tenis", label: "Tênis" },
  { slug: "mules", label: "Chanel" },
  { slug: "tamancos", label: "Tamancos" },
  { slug: "papete", label: "Papete" },
  { slug: "sapatilhas", label: "Sapatilhas" },
  { slug: "semijoias", label: "Semijoias" },
  { slug: "acessorios", label: "Acessórios" },
];

export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  price: number | null; // null = a confirmar
  image: string;
  /** Fotos secundárias exibidas na página do produto (perfil e traseira/detalhe). */
  images?: string[];
  sizes: number[];
  featured?: boolean;
  /** codigo do produto no Phibo (codigo + cor) — usado na importacao */
  phibo?: string;
  /** estoque por numeracao: { "36": 2 } */
  estoque?: Record<string, number> | null;
  /** acessorios e semijoias nao tem numeracao — vendem em tamanho unico */
  tamanhoUnico?: boolean;
};

/**
 * Peso aproximado (kg) de um item sem numeração, pelo nome. Bolsa e nécessaire
 * pesam e ocupam; brinco, lenço e carteira cabem num envelope.
 */
export function pesoMiudo(nome: string): number {
  return /bolsa|n[ée]cessaire/i.test(nome) ? 0.4 : 0.05;
}

/** Um item sem numeração que não cabe em envelope. */
export function ehVolumoso(nome: string): boolean {
  return /bolsa|n[ée]cessaire/i.test(nome);
}

/** Valor de `size` no carrinho para produto sem numeracao. */
export const TAMANHO_UNICO = 0;

/** Como a numeracao aparece para a cliente (carrinho, checkout, pedido). */
export function rotuloTamanho(size: number): string {
  return size === TAMANHO_UNICO ? "Tamanho único" : `Nº ${size}`;
}

const S = [34, 35, 36, 37, 38, 39];

export const products: Product[] = [
  // ---------------- Scarpins ----------------
  {
    slug: "scarpin-preto-no-metalizado",
    name: "Scarpin Preto com Nó Metalizado Grafite",
    category: "scarpins",
    description:
      "Um clássico atemporal com um toque de ousadia: bico fino que alonga as pernas e nó em metalizado grafite que acrescenta sofisticação. Perfeito para jantares e eventos à noite.",
    price: 139.90,
    image: "/produtos/scarpin-preto-no-metalizado.jpg",
    sizes: S,
  },
  {
    slug: "scarpin-slingback-branco",
    name: "Scarpin Slingback Branco Bico Fino",
    category: "scarpins",
    description:
      "Delicadeza em estado puro: slingback branco com fivela dourada que valoriza o pé e traz leveza a produções de dia ou de noite. Ideal para casamentos e ocasiões especiais.",
    price: 139.90,
    image: "/produtos/scarpin-slingback-branco.jpg",
    sizes: S,
  },
  {
    slug: "scarpin-branco-verniz-sola-vermelha",
    name: "Scarpin Branco Verniz com Sola Vermelha",
    category: "scarpins",
    description:
      "O brilho do verniz encontra a sola vermelha para um resultado poderoso e feminino. Um scarpin branco que ilumina o look e transforma qualquer ocasião em um momento de desejo.",
    price: 139.90,
    image: "/produtos/scarpin-branco-verniz-sola-vermelha.jpg",
    sizes: S,
  },
  {
    slug: "scarpin-slingback-vinho",
    name: "Scarpin Slingback Vinho Bico Fino",
    category: "scarpins",
    description:
      "O vinho é o tom da elegância madura e sensual. Com bico fino, salto fino e fivela dourada no slingback, eleva do trabalho ao jantar com irresistível sofisticação.",
    price: 139.90,
    image: "/produtos/scarpin-slingback-vinho.jpg",
    sizes: S,
  },
  {
    slug: "scarpin-rosa-glitter",
    name: "Scarpin Rosa Glitter Salto Alto",
    category: "scarpins",
    description:
      "Para brilhar de verdade: o glitter rosé transforma o scarpin na estrela da festa. Bico fino e salto alto para arrasar em formaturas e celebrações inesquecíveis.",
    price: 139.90,
    image: "/produtos/scarpin-rosa-glitter.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "scarpin-slingback-preto",
    name: "Scarpin Slingback Preto Bico Fino",
    category: "scarpins",
    description:
      "O coringa do guarda-roupa em sua versão mais chique: slingback preto com fivela dourada, que respira sofisticação. Do escritório ao happy hour, sempre impecável.",
    price: 139.90,
    image: "/produtos/scarpin-slingback-preto.jpg",
    sizes: S,
  },
  {
    slug: "scarpin-vermelho-verniz",
    name: "Scarpin Vermelho Verniz Salto Alto",
    category: "scarpins",
    description:
      "Vermelho é atitude. Em verniz brilhante e com bico fino, este scarpin é o toque de desejo que faltava para os seus momentos mais marcantes.",
    price: 139.90,
    image: "/produtos/scarpin-vermelho-verniz.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "scarpin-branco-verniz-sola-vermelha-2",
    name: "Scarpin Branco Verniz Salto Alto e Sola Vermelha",
    category: "scarpins",
    description:
      "Sofisticação que não passa despercebida: verniz branco impecável e sola vermelha assinando cada passo. Perfeito para noivas e para quem ama um look poderoso.",
    price: 139.90,
    image: "/produtos/scarpin-branco-verniz-sola-vermelha-2.jpg",
    sizes: S,
  },

  // ---------------- Sandálias ----------------
  {
    slug: "sandalia-caramelo-salto-bloco",
    name: "Sandália Caramelo Salto Bloco com Detalhe Dourado",
    category: "sandalias",
    description:
      "Conforto e elegância em harmonia: salto bloco que garante estabilidade o dia todo e detalhe dourado no peito do pé que adiciona um toque de luxo. Linda com vestidos fluidos.",
    price: 109.90,
    image: "/produtos/sandalia-caramelo-salto-bloco.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "sandalia-slingback-azul-serenity",
    name: "Sandália Slingback Azul Serenity",
    category: "sandalias",
    description:
      "Um respiro de cor para looks memoráveis: o azul serenity em verniz traz frescor e delicadeza, com bico fino e slingback que afinam a silhueta. Ideal para madrinhas.",
    price: 109.90,
    image: "/produtos/sandalia-slingback-azul-serenity.jpg",
    sizes: S,
  },
  {
    slug: "sandalia-off-white-salto-bloco",
    name: "Sandália Off-White Salto Bloco Bico Quadrado",
    category: "sandalias",
    description:
      "Minimalismo sofisticado: o off-white ilumina a pele e o enfeite dourado no bico quadrado dá o toque de desejo. Salto bloco confortável para brilhar do casamento ao jantar.",
    price: 109.90,
    image: "/produtos/sandalia-off-white-salto-bloco.jpg",
    sizes: S,
  },
  {
    slug: "sandalia-preta-tiras-cruzadas",
    name: "Sandália Preta Salto Bloco com Tiras Cruzadas",
    category: "sandalias",
    description:
      "A sandália preta que não pode faltar: tiras cruzadas modernas, bico quadrado em alta e salto bloco para horas de conforto. Versátil, elegante e sempre certeira.",
    price: 109.90,
    image: "/produtos/sandalia-preta-tiras-cruzadas.jpg",
    sizes: S,
  },
  {
    slug: "sandalia-preta-croco-strass",
    name: "Sandália Preta Croco com Tira de Strass",
    category: "sandalias",
    description:
      "Sensualidade e brilho na medida: textura croco preta, tira de strass no peito do pé e salto bloco estável. O par ideal para noites especiais e looks de festa.",
    price: 109.90,
    image: "/produtos/sandalia-preta-croco-strass.jpg",
    sizes: S,
  },

  // ---------------- Botas ----------------
  {
    slug: "bota-caramelo-camurca-fivela",
    name: "Bota Cano Curto Caramelo em Camurça",
    category: "botas",
    description:
      "Aconchego e elegância para os dias mais frescos: camurça caramelo sofisticada e fivela dourada que dá o toque de desejo. Bico fino e salto bloco que alongam a silhueta.",
    price: 189.90,
    image: "/produtos/bota-caramelo-camurca-fivela.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "bota-preta-croco",
    name: "Bota Cano Curto Preta Textura Croco",
    category: "botas",
    description:
      "Poder e sensualidade em textura croco: bico fino e salto alto para uma presença marcante. A ankle boot certa para looks de outono-inverno impecáveis.",
    price: 189.90,
    image: "/produtos/bota-preta-croco.jpg",
    sizes: S,
  },
  {
    slug: "bota-preta-fivelas-tachas",
    name: "Bota Cano Curto Preta com Fivelas e Tachas",
    category: "botas",
    description:
      "Atitude com sofisticação: botinha preta com fivelas e tachas prateadas que dão o toque fashion aos looks de inverno. Salto baixo confortável para usar o dia inteiro.",
    price: 189.90,
    image: "/produtos/bota-preta-fivelas-tachas.jpg",
    sizes: S,
  },
  {
    slug: "bota-terracota-cano-medio",
    name: "Bota Cano Médio Terracota Bico Fino",
    category: "botas",
    description:
      "Elegância que aquece: o tom terracota é tendência e o bico fino com salto alto desenha a silhueta. Acabamento dourado para looks de inverno cheios de estilo.",
    price: 189.90,
    image: "/produtos/bota-terracota-cano-medio.jpg",
    sizes: S,
  },

  // ---------------- Rasteirinhas ----------------
  {
    slug: "rasteira-nude-strass",
    name: "Rasteira Slide Nude com Tiras de Strass",
    category: "rasteirinhas",
    description:
      "Delicadeza para os dias quentes: o nude alonga as pernas e as tiras de strass dão o brilho na medida. Confortável e sofisticada, do passeio ao almoço especial.",
    price: 79.90,
    image: "/produtos/rasteira-nude-strass.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "rasteira-prata-cruzada",
    name: "Rasteira Slide Prata com Tiras Cruzadas",
    category: "rasteirinhas",
    description:
      "Um toque de brilho para o dia a dia: tiras cruzadas cravejadas em tom prata que iluminam qualquer produção. Leveza e conforto com muito charme.",
    price: 79.90,
    image: "/produtos/rasteira-prata-cruzada.jpg",
    sizes: S,
  },
  {
    slug: "rasteira-dedo-rose-strass",
    name: "Rasteira de Dedo Rosé com Tira de Strass",
    category: "rasteirinhas",
    description:
      "A elegância descomplicada do modelo de dedo, com tira de strass e acabamento rosé metalizado. Perfeita para o verão com um toque de sofisticação.",
    price: 79.90,
    image: "/produtos/rasteira-dedo-rose-strass.jpg",
    sizes: S,
  },

  // ---------------- Mocassins / Sapatilhas ----------------
  {
    slug: "mocassim-off-white-fivela",
    name: "Mocassim Bico Fino Off-White com Fivela Dourada",
    category: "mocassins",
    description:
      "O charme atemporal do mocassim em versão bico fino: off-white que traz leveza e fivela dourada, um toque de luxo discreto. Conforto elegante para o dia a dia.",
    price: 89.90,
    image: "/produtos/mocassim-off-white-fivela.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "mocassim-cinza-camurca-corrente",
    name: "Mocassim Bico Fino Cinza em Camurça",
    category: "mocassins",
    description:
      "Sofisticação em cada detalhe: camurça cinza versátil e corrente dourada que dá um ar refinado. Perfeito para looks de trabalho estilosos e confortáveis.",
    price: 89.90,
    image: "/produtos/mocassim-cinza-camurca-corrente.jpg",
    sizes: S,
  },
  {
    slug: "mocassim-marrom-fivela",
    name: "Mocassim Bico Fino Marrom com Fivela Dourada",
    category: "mocassins",
    description:
      "Clássico e elegante, o mocassim marrom com fivela dourada é o coringa das produções sofisticadas. Conforto o dia todo com muito estilo.",
    price: 89.90,
    image: "/produtos/mocassim-marrom-fivela.jpg",
    sizes: S,
  },

  // ---------------- Tênis ----------------
  {
    slug: "tenis-preto-plataforma",
    name: "Tênis Preto Casual com Solado Plataforma",
    category: "tenis",
    description:
      "Conforto que combina com tudo: tênis preto de solado plataforma branco que eleva o look casual com um toque moderno. Para os dias corridos sem abrir mão do estilo.",
    price: 109.90,
    image: "/produtos/tenis-preto-plataforma.jpg",
    sizes: S,
  },
  {
    slug: "tenis-retro-off-white",
    name: "Tênis Retrô Off-White com Solado Caramelo",
    category: "tenis",
    description:
      "O queridinho retrô que virou paixão: off-white com solado caramelo, perfeito para looks despojados e cheios de personalidade. Conforto do dia a dia ao fim de semana.",
    price: 109.90,
    image: "/produtos/tenis-retro-off-white.jpg",
    sizes: S,
  },

  // ---------------- Mules ----------------
  {
    slug: "mule-azul-serenity",
    name: "Chanel Azul Serenity Salto Bloco com Detalhe Dourado",
    category: "mules",
    description:
      "Tendência e conforto em um só par: mule azul serenity com ferragem dourada e detalhe no dedo, moderno e delicado. Ideal para compor looks do trabalho ao happy hour.",
    price: null,
    image: "/produtos/mule-azul-serenity.jpg",
    sizes: S,
    featured: true,
  },

  // ---------------- Papete ----------------
  {
    slug: "papete-rose-strass-cristal",
    name: "Papete Rosé com Tiras de Strass Cristal",
    category: "papete",
    description:
      "Conforto de verdade com muito brilho: tiras cravejadas de strass cristal sobre um solado flatform rosé macio. A papete perfeita para o verão, do passeio ao fim de tarde.",
    price: 89.90,
    image: "/produtos/sandalia-flatform-rose-strass.jpg",
    sizes: S,
    featured: true,
  },
  {
    slug: "papete-rose-strass-dourado",
    name: "Papete Rosé com Tiras de Strass Dourado",
    category: "papete",
    description:
      "O charme do strass rosé-dourado em uma papete leve e confortável. Solado flatform que abraça o pé e combina com tudo — sofisticada sem abrir mão do conforto.",
    price: 89.90,
    image: "/produtos/sandalia-flatform-rose-strass-2.jpg",
    sizes: S,
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function productsByCategory(cat: CategorySlug): Product[] {
  return products.filter((p) => p.category === cat);
}

export function featuredProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function categoryLabel(slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.label ?? slug;
}
