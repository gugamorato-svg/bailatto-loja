const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente.");

const catalogo = await fetch(
  `${supabaseUrl}/storage/v1/object/public/bailatto/data/products.json?cb=${Date.now()}`,
  { cache: "no-store" },
).then((resposta) => resposta.json());

const categoriasCalcados = new Set([
  "botas", "chinelos", "mocassins", "mules", "papete", "rasteirinhas",
  "sandalias", "sapatilhas", "scarpins", "tamancos", "tenis",
]);
const calcados = catalogo.filter((produto) => categoriasCalcados.has(produto.category));
const falhas = [];

for (let inicio = 0; inicio < calcados.length; inicio += 12) {
  const lote = calcados.slice(inicio, inicio + 12);
  const resultados = await Promise.all(
    lote.map(async (produto) => {
      const url = `https://bailatto.com.br/produtos/${produto.slug}?qa=${Date.now()}`;
      const resposta = await fetch(url, { cache: "no-store" });
      const html = await resposta.text();
      const galeria = html.includes("Ver foto principal") &&
        html.includes("Ver perfil") && html.includes("Ver outro ângulo");
      return { slug: produto.slug, status: resposta.status, galeria };
    }),
  );
  falhas.push(...resultados.filter((item) => item.status !== 200 || !item.galeria));
}

console.log(JSON.stringify({ paginasTestadas: calcados.length, falhas }, null, 2));
if (falhas.length) process.exitCode = 1;
