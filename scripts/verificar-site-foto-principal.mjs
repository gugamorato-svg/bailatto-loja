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
  const resultados = await Promise.all(lote.map(async (produto) => {
    const resposta = await fetch(
      `https://bailatto.com.br/produtos/${produto.slug}?qa=${Date.now()}`,
      { cache: "no-store" },
    );
    const html = await resposta.text();
    // As URLs arquivadas podem permanecer no payload do produto para permitir
    // restauração futura. O que não pode existir é a interface de galeria.
    const temGaleria = html.includes("Ver foto principal") ||
      html.includes("Ver perfil") || html.includes("Ver outro ângulo");
    return { slug: produto.slug, status: resposta.status, temGaleria };
  }));
  falhas.push(...resultados.filter((item) => item.status !== 200 || item.temGaleria));
}

const sitemap = await fetch(`https://bailatto.com.br/sitemap.xml?qa=${Date.now()}`, {
  cache: "no-store",
}).then((resposta) => resposta.text());
const galeriaNoSitemap = sitemap.includes("/galeria/");

console.log(JSON.stringify({
  paginasTestadas: calcados.length,
  paginasComGaleriaOuErro: falhas,
  galeriaNoSitemap,
}, null, 2));

if (falhas.length || galeriaNoSitemap) process.exitCode = 1;
