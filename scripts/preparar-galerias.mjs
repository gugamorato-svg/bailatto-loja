import fs from "node:fs";
import path from "node:path";

const CATEGORIAS_CALCADOS = new Set([
  "scarpins",
  "sandalias",
  "chinelos",
  "botas",
  "rasteirinhas",
  "mocassins",
  "tenis",
  "mules",
  "tamancos",
  "papete",
  "sapatilhas",
]);

const raiz = process.cwd();
const saida = path.join(raiz, "output", "imagegen", "galerias-bailatto-20260903");
const catalogoUrl =
  "https://tgnxixkmwgifqrksejgg.supabase.co/storage/v1/object/public/bailatto/data/products.json";

fs.mkdirSync(saida, { recursive: true });

const resposta = await fetch(`${catalogoUrl}?t=${Date.now()}`);
if (!resposta.ok) throw new Error(`Falha ao baixar o catálogo: HTTP ${resposta.status}`);
const catalogo = await resposta.json();

const itens = catalogo
  .filter((produto) => produto.active !== false && CATEGORIAS_CALCADOS.has(produto.category))
  .map((produto) => {
    const original = path.join(raiz, "public", "produtos", `${produto.slug}.jpg`);
    const atual = produto.image.startsWith("/")
      ? path.join(raiz, "public", produto.image.replace(/^\//, ""))
      : null;
    return {
      slug: produto.slug,
      name: produto.name,
      category: produto.category,
      original,
      styleReference: atual && fs.existsSync(atual) ? atual : original,
      outputProfile: path.join(saida, `${produto.slug}-perfil.jpg`),
      outputAngle: path.join(saida, `${produto.slug}-angulo.jpg`),
      originalExists: fs.existsSync(original),
    };
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const ausentes = itens.filter((item) => !item.originalExists);
if (ausentes.length) {
  throw new Error(
    `Faltam ${ausentes.length} originais: ${ausentes.map((item) => item.slug).join(", ")}`,
  );
}

fs.writeFileSync(path.join(saida, "manifest.json"), JSON.stringify(itens, null, 2));
console.log(JSON.stringify({ total: itens.length, ausentes: ausentes.length, saida }, null, 2));

