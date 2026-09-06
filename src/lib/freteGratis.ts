/**
 * Política de frete grátis por região.
 *
 * Os limiares saíram de dois números medidos, não de chute:
 *
 * 1. CUSTO REAL do envio de 1 par (0,75 kg) saindo de São Carlos, cotado na
 *    SuperFrete: SP interior R$ 12,88 · SP capital R$ 14,39 · MG R$ 15,11 ·
 *    RJ R$ 15,82 · PR R$ 14,62 · SC R$ 16,22 · RS R$ 16,52 · GO R$ 17,37 ·
 *    BA R$ 17,17 · PE R$ 19,50 · CE R$ 19,71 · MT R$ 23,50 · PA R$ 24,41 ·
 *    AM R$ 34,14.
 * 2. TICKET MÉDIO e número de itens por pedido, apurados sobre os pedidos
 *    reais no Supabase (rode a apuração de novo antes de mexer nos limiares —
 *    o ticket muda conforme o mix de produto).
 *
 * O limiar fica ACIMA do ticket atual de propósito: frete grátis abaixo dele
 * só daria de presente o que a cliente já ia gastar. Acima, ela precisa somar
 * um item — e é aí que as semijoias de R$ 15 a R$ 40 entram.
 *
 * A regra de bolso: o frete absorvido tem de ficar bem abaixo de 10% da margem
 * do pedido no limiar. O Norte fica de fora porque lá o envio custa o dobro do
 * Sudeste e o volume não justifica.
 */
export const LIMIARES: { ufs: string[]; limiar: number; rotulo: string }[] = [
  { ufs: ["SP", "MG", "RJ", "ES", "PR"], limiar: 349, rotulo: "Sudeste e Paraná" },
  { ufs: ["SC", "RS", "GO", "DF", "MS", "BA"], limiar: 399, rotulo: "Sul, Centro-Oeste e Bahia" },
  {
    ufs: ["PE", "CE", "MT", "SE", "AL", "PB", "RN", "PI", "MA"],
    limiar: 449,
    rotulo: "Nordeste e Mato Grosso",
  },
];

/** UF sem frete grátis: o envio custa de R$ 24 a R$ 34 e comeria a margem. */
export function limiarDaUf(uf?: string | null): number | null {
  if (!uf) return null;
  const u = uf.trim().toUpperCase();
  return LIMIARES.find((g) => g.ufs.includes(u))?.limiar ?? null;
}

/** Menor limiar do país — é o que a sacola mostra antes de saber o CEP. */
export const LIMIAR_BASE = Math.min(...LIMIARES.map((g) => g.limiar));

export function faltaParaFreteGratis(subtotal: number, uf?: string | null) {
  const limiar = limiarDaUf(uf) ?? LIMIAR_BASE;
  return { limiar, falta: Math.max(0, limiar - subtotal), atingiu: subtotal >= limiar };
}
