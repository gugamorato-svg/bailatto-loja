import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { lerCsvPhibo, sugerir } from "../src/lib/phibo.ts";

const APLICAR = process.argv.includes("--aplicar");

/**
 * Nomes corretos informados pela loja, na ordem em que aparecem na vitrine.
 * Estes usam o mesmo vocabulário do Phibo — por isso o casamento agora funciona
 * (os nomes anteriores tinham sido inventados a partir das fotos).
 */
const NOMES = [
  "Sandália Bloco Suede Marrom",
  "Sandália Bico Folha Azul",
  "Sandália Dedo Alto Off White",
  "Sandália Salto Mínimo X Preto",
  "Sandália Croco Preto",
  "Bota Suede Marrom",
  "Bota Croco Preto",
  "Bota Fivela Baixo Preto",
  "Bota Napa Marrom",
  "Rasteira 6 Tiras Nude",
  "Rasteira X Prata",
  "Rasteira Nó Cobre",
  "Mocassim Off White",
  "Mocassim Suede Cinza",
  "Mocassim Marrom",
  "Tênis Casual Plataforma Preto",
];

const FAMILIA = {
  sandalias: (d) => /SAND[ÁA]LIA/i.test(d) && !/RASTEIRA|PAPETE/i.test(d),
  botas: (d) => /BOTA/i.test(d),
  rasteirinhas: (d) => /RASTEIRA/i.test(d),
  mocassins: (d) => /MOCASSIM|SAPATILHA/i.test(d),
  tenis: (d) => /TENIS/i.test(d),
  papete: (d) => /PAPETE/i.test(d),
  mules: (d) => /SAND[ÁA]LIA|MULE/i.test(d),
};

function descrever(nome) {
  const n = nome.toLowerCase();
  const cor = (nome.split(" ").pop() ?? "").toLowerCase();
  if (n.includes("bico folha"))
    return `Sandália de bico folha em ${cor}: o formato alonga o pé e dá um ar refinado ao look. Salto que sustenta bem, para usar a noite toda com elegância.`;
  if (n.includes("dedo alto"))
    return `Tira no dedo e salto alto em ${cor} — o par que afina a silhueta e combina com vestido, saia ou alfaiataria. Elegância que não passa despercebida.`;
  if (n.includes("salto mínimo") || n.includes("salto minimo"))
    return `Tiras em X e salto baixinho em ${cor}: o conforto de uma rasteira com o charme de uma sandália. Perfeita para o dia inteiro.`;
  if (n.includes("croco") && n.includes("bota"))
    return `Ankle boot em textura croco ${cor}. Presença marcante para os looks de outono-inverno, com bico fino que alonga as pernas.`;
  if (n.includes("croco"))
    return `Textura croco em ${cor} para um toque sofisticado e moderno. A sandália certa quando o look pede personalidade.`;
  if (n.includes("bota") && n.includes("suede"))
    return `Bota em camurça ${cor}: aconchego e elegância para os dias frescos. O salto bloco garante firmeza a cada passo.`;
  if (n.includes("bota") && n.includes("fivela"))
    return `Botinha ${cor} com fivela — atitude com sofisticação. Salto confortável para usar do trabalho ao happy hour.`;
  if (n.includes("bota") && n.includes("napa"))
    return `Bota de cano curto em napa ${cor}, macia e elegante. Combina com jeans, vestido e todos os looks de inverno.`;
  if (n.includes("rasteira") && n.includes("tiras"))
    return `Rasteira de tiras em ${cor}: leveza e brilho para os dias quentes. Confortável do passeio ao almoço especial.`;
  if (n.includes("rasteira") && n.includes("nó"))
    return `Rasteira com nó em ${cor} — delicada, confortável e fácil de combinar. O básico que nunca sai de moda.`;
  if (n.includes("rasteira"))
    return `Rasteira em ${cor} com acabamento caprichado. Conforto o dia todo, sem abrir mão do charme.`;
  if (n.includes("mocassim") && n.includes("suede"))
    return `Mocassim em camurça ${cor}: o clássico que resolve o look de trabalho com conforto e sofisticação.`;
  if (n.includes("mocassim"))
    return `Mocassim ${cor} de bico fino — elegante, confortável e coringa. Do escritório ao café da tarde, sempre impecável.`;
  if (n.includes("tênis") || n.includes("tenis"))
    return `Tênis casual ${cor} com solado plataforma: conforto para os dias corridos com um toque moderno que eleva o look.`;
  if (n.includes("bloco"))
    return `Salto bloco em ${cor} — o equilíbrio entre altura e conforto. Ideal para quem fica horas em pé sem abrir mão do estilo.`;
  return `Modelo em ${cor} com acabamento caprichado, escolhido a dedo para a nossa coleção.`;
}

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const CORES = ["branco", "rosa", "marrom", "verde", "preto", "dourado", "prata",
  "nude", "azul", "vermelho", "caramelo", "cinza", "vinho", "bege", "cobre", "roxo"];
const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Cor citada no nome — pega a ÚLTIMA, que é como a loja nomeia (modelo + cor). */
const corDoNome = (nome) => {
  const t = semAcento(nome).split(/\s+/);
  for (let i = t.length - 1; i >= 0; i--) if (CORES.includes(t[i])) return t[i];
  return null;
};

const itens = lerCsvPhibo(fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8"));

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let data = null;
for (let t = 1; t <= 4 && !data; t++) {
  ({ data } = await sb.storage.from("bailatto").download("data/products.json"));
  if (!data) await new Promise((r) => setTimeout(r, 1500));
}
if (!data) { console.error("nao consegui baixar a lista"); process.exit(1); }
const lista = JSON.parse(await data.text());

const antigos = lista.filter((p) => p.category !== "scarpins");
if (antigos.length < NOMES.length) {
  console.error("esperava pelo menos", NOMES.length, "produtos antigos, achei", antigos.length);
  process.exit(1);
}

// Atribuição global: sem isso dois produtos parecidos (ex.: "Bota Suede Marrom"
// e "Bota Napa Marrom") acabam apontando para o mesmo item do Phibo.
const candidatosPorIndice = new Map();
const disputa = [];
for (let i = 0; i < NOMES.length; i++) {
  const filtro = FAMILIA[antigos[i].category];
  const lista = filtro ? itens.filter((x) => filtro(x.descricao)) : [];
  const s = sugerir(NOMES[i], lista, 8);
  candidatosPorIndice.set(i, s);
  for (const c of s) disputa.push({ i, item: c.item, score: c.score });
}
disputa.sort((a, b) => b.score - a.score);
const escolhido = new Map();
const ocupado = new Set();

// Exceções confirmadas manualmente: a loja e o Phibo usam nomes de cor
// diferentes para o mesmo sapato (aqui, "marrom" x "Caramelo"), então o
// casamento automático escolhe o material errado.
const EXCECOES = { 0: { descricao: "SANDÁLIA BLOCO SUEDE", cor: "Caramelo" } };
for (const [idx, alvo] of Object.entries(EXCECOES)) {
  const item = itens.find((x) => x.descricao === alvo.descricao && x.cor === alvo.cor);
  if (item) {
    escolhido.set(Number(idx), item);
    ocupado.add(item.chave);
  }
}

for (const d of disputa) {
  if (escolhido.has(d.i) || ocupado.has(d.item.chave)) continue;
  escolhido.set(d.i, d.item);
  ocupado.add(d.item.chave);
}

const renomeios = [];
for (let i = 0; i < NOMES.length; i++) {
  const p = antigos[i];
  const nome = NOMES[i];
  const novoSlug = slugify(nome);
  const item = escolhido.get(i);

  let preco = p.price;
  let estoque = null;
  let tamanhos = p.sizes;
  let obs = "sem correspondente";

  if (item) {
    const cn = corDoNome(nome);
    const ci = semAcento(item.cor || "");
    const equivalentes = (a, b) => (a === b) || [a, b].every((c) => c === "marrom" || c === "caramelo");
    const corOk = !cn || !ci || equivalentes(cn, ci);
    preco = item.preco;
    if (corOk) {
      const e = {};
      for (const [t, q] of Object.entries(item.tamanhos)) if (q > 0) e[t] = q;
      const ts = Object.keys(e).map(Number).sort((a, b) => a - b);
      if (ts.length) { estoque = e; tamanhos = ts; }
    }
    obs = `${item.descricao} / ${item.cor}${corOk ? "" : "  [COR NÃO CONFERE]"}`;
  }

  renomeios.push({ slugAntigo: p.slug, novoSlug, nome, preco, estoque, tamanhos, item, obs, precoAntigo: p.price });

  console.log(`${i + 1}. ${p.name}`);
  console.log(`   -> ${nome}`);
  console.log(`   ${obs}`);
  console.log(`   preço R$ ${p.price} -> R$ ${preco}   estoque: ${estoque ? Object.entries(estoque).map(([t, q]) => t + ":" + q).join(" ") : "—"}\n`);
}

if (!APLICAR) {
  console.log("PRÉVIA — rode com --aplicar para gravar.");
  process.exit(0);
}

// renomeia os arquivos de imagem junto
for (const r of renomeios) {
  const de = path.join("public/produtos", r.slugAntigo + ".jpg");
  const para = path.join("public/produtos", r.novoSlug + ".jpg");
  if (fs.existsSync(de) && de !== para) fs.renameSync(de, para);
}

for (const r of renomeios) {
  const i = lista.findIndex((p) => p.slug === r.slugAntigo);
  if (i < 0) continue;
  lista[i] = {
    ...lista[i],
    name: r.nome,
    slug: r.novoSlug,
    image: `/produtos/${r.novoSlug}.jpg`,
    description: descrever(r.nome),
    price: r.preco,
    estoque: r.estoque,
    sizes: r.tamanhos,
    phibo: r.item?.chave ?? null,
    phiboDesc: r.item ? `${r.item.descricao} / ${r.item.cor}` : null,
  };
}

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
await sb.storage.from("bailatto").upload(`data/backup-products-${carimbo}.json`, JSON.stringify(lista, null, 2), { contentType: "application/json" });
const { error } = await sb.storage.from("bailatto").upload("data/products.json", JSON.stringify(lista, null, 2), { upsert: true, contentType: "application/json" });
if (error) { console.error("upload:", error.message); process.exit(1); }
console.log(`aplicado: ${renomeios.length} produtos renomeados e vinculados (backup ${carimbo})`);
