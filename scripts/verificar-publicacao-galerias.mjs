const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente.");

const catalogUrl = `${supabaseUrl}/storage/v1/object/public/bailatto/data/products.json?cb=${Date.now()}`;
const resposta = await fetch(catalogUrl, { cache: "no-store" });
if (!resposta.ok) throw new Error(`Catálogo HTTP ${resposta.status}`);
const produtos = await resposta.json();

const categoriasCalcados = new Set([
  "botas",
  "chinelos",
  "mocassins",
  "mules",
  "papete",
  "rasteirinhas",
  "sandalias",
  "sapatilhas",
  "scarpins",
  "tamancos",
  "tenis",
]);
const calcados = produtos.filter((produto) => categoriasCalcados.has(produto.category));
const incompletos = calcados.filter((produto) => !Array.isArray(produto.images) || produto.images.length !== 2);
const urls = calcados.flatMap((produto) => produto.images ?? []);
const duplicadas = urls.filter((url, index) => urls.indexOf(url) !== index);

const falhas = [];
for (let inicio = 0; inicio < urls.length; inicio += 30) {
  const lote = urls.slice(inicio, inicio + 30);
  const resultados = await Promise.all(
    lote.map(async (url) => {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return { url, status: r.status };
    }),
  );
  falhas.push(...resultados.filter((item) => item.status !== 200));
}

const resultado = {
  produtos: produtos.length,
  calcados: calcados.length,
  calcadosComTresFotos: calcados.length - incompletos.length,
  galeriasIncompletas: incompletos.map((produto) => produto.slug),
  imagensSecundarias: urls.length,
  urlsDuplicadas: [...new Set(duplicadas)],
  urlsComFalha: falhas,
};
console.log(JSON.stringify(resultado, null, 2));

if (incompletos.length || duplicadas.length || falhas.length) process.exitCode = 1;
