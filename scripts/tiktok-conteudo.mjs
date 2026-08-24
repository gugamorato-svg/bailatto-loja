// Reescreve nome e descrição dos produtos para a busca interna do TikTok Shop.
//
// Regra que atravessa o arquivo inteiro: só entra no texto o que os dados
// sustentam. Material e salto saem do nome vindo do Phibo (mesma lógica do
// FichaTecnica.tsx do site). Nada de "cano curto", "bico fino" ou
// "confortável" quando não temos como afirmar — isso é atributo enganoso em
// título, que a política do TikTok proíbe, e vira troca depois.
//
//   node scripts/tiktok-conteudo.mjs [--amostra N]
import { readFileSync, writeFileSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const CM = {
  33: "21,3", 34: "22,0", 35: "22,7", 36: "23,3",
  37: "24,0", 38: "24,7", 39: "25,3", 40: "26,0",
};

/** Como a cliente chama o produto, não como o Phibo cadastra. */
const TIPO = {
  scarpins: ["Scarpin", "Feminino"],
  sandalias: ["Sandália", "Feminina"],
  botas: ["Bota", "Feminina"],
  // "rasteirinha" é o diminutivo que realmente se digita na busca.
  rasteirinhas: ["Rasteirinha", "Feminina"],
  mocassins: ["Mocassim", "Feminino"],
  tenis: ["Tênis", "Feminino"],
  mules: ["Mule", "Feminina"],
  tamancos: ["Tamanco", "Feminino"],
  papete: ["Papete", "Feminina"],
  sapatilhas: ["Sapatilha", "Feminina"],
};

/** Ocasiões por tipo. A 1ª é a padrão; as outras evitam canibalização. */
const OCASIOES = {
  scarpins: ["Festa", "Trabalho", "Social", "Formatura", "Madrinha"],
  sandalias: ["Festa", "Verão", "Dia a Dia", "Social"],
  botas: ["Inverno", "Casual", "Dia a Dia"],
  rasteirinhas: ["Verão", "Dia a Dia", "Praia"],
  mocassins: ["Trabalho", "Casual", "Dia a Dia"],
  tenis: ["Dia a Dia", "Casual", "Caminhada"],
  mules: ["Trabalho", "Casual"],
  tamancos: ["Verão", "Dia a Dia"],
  papete: ["Verão", "Praia"],
  sapatilhas: ["Trabalho", "Dia a Dia", "Casual"],
};

const MATERIAIS = [
  [/verniz/, "Verniz"], [/napa/, "Napa"], [/suede|camurca/, "Suede"],
  [/croco/, "Croco"], [/glitter/, "Glitter"], [/linho/, "Linho"],
  [/jeans/, "Jeans"], [/lezar|lezzar/, "Lezard"], [/onca/, "Onça"],
  [/cobra/, "Cobra"], [/xadrez/, "Xadrez"],
];

/**
 * Cor no masculino (como vem do Phibo) e no feminino. "Bota Feminina Preto"
 * é o tipo de erro que faz o anúncio parecer automático e mal cuidado.
 * As invariáveis repetem a mesma forma nas duas colunas.
 */
const CORES = [
  ["off white", "off white"], ["azul escuro", "azul escuro"],
  ["azul serenity", "azul serenity"], ["azul baby", "azul baby"],
  ["marrom claro", "marrom claro"], ["vermelho", "vermelha"],
  ["branco", "branca"], ["dourado", "dourada"], ["caramelo", "caramelo"],
  ["serenity", "serenity"], ["marrom", "marrom"], ["preto", "preta"],
  ["prata", "prata"], ["cobre", "cobre"], ["cinza", "cinza"],
  ["verde", "verde"], ["vinho", "vinho"], ["nude", "nude"],
  ["bege", "bege"], ["rose", "rosé"], ["rosa", "rosa"],
  ["roxo", "roxa"], ["laranja", "laranja"], ["azul", "azul"],
  ["jeans", "jeans"],
];

/**
 * Termo genérico que a cliente também digita. É sinônimo verdadeiro do tipo,
 * não atributo inventado — e é o que faz o título sair dos 45 caracteres.
 */
const GENERICO = {
  scarpins: ["Sapato", "feminino"],
  sandalias: ["Sapato", "feminino"],
  botas: ["Botinha", "feminina"],
  rasteirinhas: ["Sandália Rasteira", "feminina"],
  mocassins: ["Sapato", "feminino"],
  tenis: ["Sapato", "feminino"],
  mules: ["Sapato", "feminino"],
  tamancos: ["Sandália", "feminina"],
  papete: ["Sandália", "feminina"],
  sapatilhas: ["Sapato", "feminino"],
};

const titulo = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Tira acento: o \b do JS ignora letras acentuadas, então "\bnó\b" nunca casa. */
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function analisar(p) {
  const n = semAcento(p.name.toLowerCase());
  // "Sola de Onça" descreve o SOLADO, não o material do sapato — tratar como
  // material faria "Vermelho Onça" parecer um sapato estampado, que não é.
  const soladoEstampado = /sola de (onca|cobra)/.test(n);
  const material = soladoEstampado
    ? null
    : (MATERIAIS.find(([re]) => re.test(n))?.[1] ?? null);
  const par = CORES.find(([m]) => n.includes(m)) ?? null;
  const cor = par ? par[0] : null;
  const corFem = par ? par[1] : null;

  let salto = null;
  if (/salto minimo/.test(n)) salto = "Salto Baixo";
  else if (/salto alto|alto/.test(n) && !/baixo/.test(n)) salto = "Salto Alto";
  else if (/baixo/.test(n)) salto = "Salto Baixo";
  else if (/plataforma|flatform/.test(n)) salto = "Plataforma";
  else if (/rasteira|sapatilha|mocassim/.test(n)) salto = "Sem Salto";

  let formato = null;
  if (/bloco/.test(n)) formato = "Bloco";
  else if (/fino/.test(n) && salto !== "Sem Salto") formato = "Fino";

  let detalhe = null;
  if (/sola de onca/.test(n)) detalhe = "Sola Onça";
  else if (/sola de cobra/.test(n)) detalhe = "Sola Cobra";
  else if (/sola vermelha/.test(n)) detalhe = "Sola Vermelha";
  else if (/slingback/.test(n)) detalhe = "Slingback";
  else if (/fivela/.test(n)) detalhe = "Fivela";
  // \b dos DOIS lados: sem o da esquerda, "fino" casava com "nó" e o produto
  // ganhava um laço que não existe.
  else if (/\bn[óo]\b|\bla[çc]os?\b/.test(n)) detalhe = "Laço";
  else if (/tiras?/.test(n)) detalhe = (n.match(/(\d+)\s*tiras?/) || [])[1]
    ? `${(n.match(/(\d+)\s*tiras?/) || [])[1]} Tiras`
    : "Tiras";

  return { material, cor, corFem, salto, formato, detalhe };
}

const produtos = await (
  await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`,
  )
).json();

// Distribui ocasiões de forma que, dentro do mesmo tipo+cor, nunca se repita
// o par — senão os anúncios competem entre si e o algoritmo divide os cliques.
const usadas = new Map();
function ocasiao(categoria, cor) {
  const lista = OCASIOES[categoria] ?? ["Dia a Dia"];
  const chave = `${categoria}|${cor ?? "-"}`;
  const n = usadas.get(chave) ?? 0;
  usadas.set(chave, n + 1);
  return lista[n % lista.length];
}

const resultado = [];

for (const p of produtos) {
  const numeracoes = Object.entries(p.estoque ?? {})
    .filter(([, q]) => q > 0)
    .map(([n]) => Number(n))
    .sort((a, b) => a - b);
  if (!TIPO[p.category] || p.price == null || numeracoes.length === 0) continue;

  const [tipo, genero] = TIPO[p.category];
  const a = analisar(p);
  const oc = ocasiao(p.category, a.cor);

  // A cor concorda com o tipo: "Bota Feminina Preta", "Scarpin Feminino Preto".
  const feminino = genero === "Feminina";
  const corNome = a.cor ? titulo(feminino ? a.corFem : a.cor) : null;

  // ---- nome: tipo e gênero nos primeiros 30 caracteres ----
  const partes = [
    tipo, genero,
    corNome,
    a.material,
    a.salto,
    a.formato,
    a.detalhe,
    oc,
  ].filter(Boolean);

  // "jeans" é cor e material ao mesmo tempo — sem isto sai "Jeans Jeans".
  const nome = [...new Set(partes)].join(" ");

  // ---- descrição ----
  const bullets = [
    a.material && `▪ Material: ${a.material}`,
    a.salto && `▪ Salto: ${a.salto.replace("Salto ", "")}${a.formato ? ` (${a.formato.toLowerCase()})` : ""}`,
    a.detalhe && `▪ Detalhe: ${a.detalhe}`,
    corNome && `▪ Cor: ${corNome}`,
    numeracoes.length === 1
      ? `▪ Numeração: ${numeracoes[0]}`
      : `▪ Numerações: ${numeracoes[0]} ao ${numeracoes[numeracoes.length - 1]}`,
  ].filter(Boolean).join("\n");

  const tabela = numeracoes
    .map((n, i) => `${n} = ${CM[n]}${i === 0 ? " cm" : ""}`)
    .join(" · ");

  const gancho =
    `${tipo}${corNome ? " " + corNome.toLowerCase() : ""}` +
    (a.material ? ` em ${a.material.toLowerCase()}` : "") +
    (a.salto && a.salto !== "Sem Salto" ? ` com ${a.salto.toLowerCase()}` : "") +
    (a.detalhe ? ` e ${a.detalhe.toLowerCase()}` : "") +
    ` — para ${oc.toLowerCase()}.`;

  // O nome fica limpo e legível; a cobertura de busca vem daqui, onde o
  // sinônimo genérico não atrapalha a leitura de ninguém.
  const t = tipo.toLowerCase();
  const [gTermo, gGenero] = GENERICO[p.category];
  const g = gTermo.toLowerCase();
  const keywords = [...new Set([
    `${t} ${genero.toLowerCase()}`,
    `${g} ${gGenero}`,
    a.material && `${t} ${a.material.toLowerCase()}`,
    corNome && `${t} ${corNome.toLowerCase()}`,
    corNome && `${g} ${corNome.toLowerCase()}`,
    a.salto && a.salto !== "Sem Salto" && `${t} ${a.salto.toLowerCase()}`,
    a.detalhe && `${t} ${a.detalhe.toLowerCase()}`,
    `${t} para ${oc.toLowerCase()}`,
  ].filter(Boolean))].join(", ");

  const descricao = `${gancho}

${bullets}

📏 NUMERAÇÃO (comprimento do pé)
${tabela}
Meça no fim do dia: pé no chão sobre uma folha, marque do calcanhar à ponta do dedo maior. Ficou entre dois números? Fique com o maior.

📦 ENTREGA E TROCA
Enviamos para todo o Brasil. Loja física em São Carlos-SP com retirada grátis. Você tem 7 dias para troca ou devolução (CDC, art. 49).

${keywords}`;

  resultado.push({ slug: p.slug, nomeAntigo: p.name, nome, descricao });
}

writeFileSync(
  new URL("tiktok-conteudo.json", raiz),
  JSON.stringify(resultado, null, 1),
);

const comp = resultado.map((r) => r.nome.length);
const fora = resultado.filter((r) => r.nome.length < 50 || r.nome.length > 95);
console.log(`produtos: ${resultado.length}`);
console.log(`nome — min ${Math.min(...comp)} | média ${Math.round(comp.reduce((a, b) => a + b, 0) / comp.length)} | max ${Math.max(...comp)}`);
console.log(`fora da faixa 50-95: ${fora.length}`);
fora.slice(0, 6).forEach((r) => console.log(`   ${r.nome.length}  ${r.nome}`));

const n = Number(process.argv[process.argv.indexOf("--amostra") + 1]) || 3;
console.log(`\n===== AMOSTRA (${n}) =====`);
for (const r of resultado.slice(0, n)) {
  console.log(`\nANTES: ${r.nomeAntigo}`);
  console.log(`DEPOIS (${r.nome.length}): ${r.nome}`);
  console.log(`---\n${r.descricao}`);
}
