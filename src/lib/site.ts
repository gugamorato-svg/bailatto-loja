/** Dados da loja usados em metadados, sitemap e dados estruturados. */
export const SITE = {
  url: "https://bailatto.com.br",
  nome: "BAILATTO Calçados",
  descricaoCurta:
    "Calçados femininos em São Carlos-SP: scarpins, sandálias, sapatilhas, botas e mais. Retirada grátis na loja ou entrega para todo o Brasil.",
  telefone: "+5516993392022",
  whatsapp: "5516993392022",
  instagram: "https://instagram.com/bailatto.calcados.saocarlos",
  /** Ficha do Google Business. No sameAs, é o que casa a identidade do site com a do GBP. */
  googleMaps: "https://maps.app.goo.gl/EZYKJ1KQmmY1WsaX9",
  endereco: {
    rua: "Rua Geminiano Costa, 416",
    bairro: "Centro",
    cidade: "São Carlos",
    uf: "SP",
    cep: "13560-641",
    pais: "BR",
  },
  horario: {
    semana: "Segunda a sexta, 9h às 18h",
    sabado: "Sábado, 9h às 13h",
  },
} as const;

export const enderecoCompleto = `${SITE.endereco.rua} — ${SITE.endereco.bairro}, ${SITE.endereco.cidade}-${SITE.endereco.uf}`;
