// Gera um artefato HTML: original × IA de todos os produtos, para o usuário
// revisar em bloco e apontar quais retocar. Miniaturas embutidas (data URI).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const catLabel = {
  scarpins: "Scarpins", sandalias: "Sandálias", chinelos: "Chinelos",
  botas: "Botas", rasteirinhas: "Rasteirinhas", mocassins: "Mocassins",
  tenis: "Tênis", mules: "Chanel", tamancos: "Tamancos", papete: "Papete",
  sapatilhas: "Sapatilhas",
};
const ordem = ["scarpins", "sandalias", "rasteirinhas", "chinelos", "botas", "mocassins", "sapatilhas", "tenis", "papete", "tamancos", "mules"];

// Tipos onde a IA pode alterar o bico/tiras — marcados para revisão.
const revisar = (p) =>
  p.category === "sandalias" || p.category === "papete" ||
  /tira|dedo|bico|folha/i.test(p.name);

const produtos = await (
  await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`)
).json();

async function thumb(caminho, largura, altura) {
  const buf = readFileSync(caminho);
  const jpg = await sharp(buf).resize(largura, altura, { fit: "cover" }).jpeg({ quality: 60 }).toBuffer();
  return "data:image/jpeg;base64," + jpg.toString("base64");
}

const porCat = {};
let feitos = 0;
for (const p of produtos) {
  const orig = new URL(`_orig/public/produtos/${p.slug}.jpg`, raiz);
  const ia = new URL(`fotos-ia/${p.slug}.png`, raiz);
  if (!existsSync(orig) || !existsSync(ia)) continue;
  const [uOrig, uIa] = await Promise.all([
    thumb(orig, 200, 150),   // original 3:2 deitada
    thumb(ia, 200, 250),     // IA 4:5 retrato
  ]);
  (porCat[p.category] ||= []).push({ ...p, uOrig, uIa });
  feitos++;
}

const cardHtml = (p) => `
      <div class="item${revisar(p) ? " rev" : ""}">
        <div class="pair">
          <figure><img src="${p.uOrig}" alt=""><figcaption>original</figcaption></figure>
          <figure><img src="${p.uIa}" alt=""><figcaption>IA</figcaption></figure>
        </div>
        <p class="nome">${p.name}</p>
        <p class="slug">${p.slug}${revisar(p) ? ' <span class="tag">revisar</span>' : ""}</p>
      </div>`;

const secoes = ordem
  .filter((c) => porCat[c])
  .map((c) => `
    <section>
      <h2>${catLabel[c]} <span class="cnt">${porCat[c].length}</span></h2>
      <div class="grid">${porCat[c].map(cardHtml).join("")}</div>
    </section>`).join("");

const html = `<title>Fotos: Original × IA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Jost:wght@300;400;500&display=swap">
<style>
  :root{ --bg:#FBFAF8;--surface:#fff;--line:#ECE7E0;--ink:#1A1613;--muted:#8C8279;--wine:#6E2438;--warn:#8A5A17;--warn-soft:#F7EEDD; }
  @media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#141110;--surface:#1D1917;--line:#2A2421;--ink:#F1EBE4;--muted:#9A8F86;--wine:#D98BA0;--warn:#D8A65C;--warn-soft:#2C2317;}}
  :root[data-theme=dark]{--bg:#141110;--surface:#1D1917;--line:#2A2421;--ink:#F1EBE4;--muted:#9A8F86;--wine:#D98BA0;--warn:#D8A65C;--warn-soft:#2C2317;}
  *{box-sizing:border-box;margin:0;}
  body{background:var(--bg);color:var(--ink);font-family:"Jost",system-ui,sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;}
  .wrap{max-width:1180px;margin:0 auto;padding:44px 20px 90px;}
  header{margin-bottom:34px;}
  h1{font-family:"Bodoni Moda",serif;font-weight:500;font-size:2rem;letter-spacing:-.01em;}
  .lede{color:var(--muted);margin-top:10px;max-width:60ch;font-size:.95rem;}
  .legenda{display:flex;gap:18px;margin-top:14px;font-size:.8rem;color:var(--muted);flex-wrap:wrap;}
  .legenda .tag{background:var(--warn-soft);color:var(--warn);}
  section{margin-top:40px;}
  h2{font-family:"Bodoni Moda",serif;font-weight:500;font-size:1.4rem;padding-bottom:10px;border-bottom:2px solid var(--line);}
  h2 .cnt{font-family:"Jost";font-size:.8rem;color:var(--muted);margin-left:6px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px 16px;margin-top:22px;}
  .item{background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:10px;}
  .item.rev{border-color:var(--warn);}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:end;}
  figure{margin:0;}
  figure img{width:100%;border-radius:2px;display:block;background:var(--line);}
  figcaption{font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-align:center;margin-top:4px;}
  .nome{font-size:.78rem;margin-top:9px;line-height:1.3;}
  .slug{font-family:ui-monospace,monospace;font-size:.66rem;color:var(--muted);margin-top:3px;word-break:break-all;}
  .tag{display:inline-block;background:var(--warn-soft);color:var(--warn);font-family:"Jost";font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;padding:1px 6px;border-radius:2px;margin-left:2px;}
  footer{margin-top:50px;color:var(--muted);font-size:.82rem;border-top:1px solid var(--line);padding-top:18px;}
</style>
<div class="wrap">
  <header>
    <h1>Fotos: original × IA</h1>
    <p class="lede">As ${feitos} fotos já estão no ar. Compare cada par e me diga os <b>slugs</b> (o código embaixo do nome) das que precisam retoque — reverto pra original ou reprocesso.</p>
    <div class="legenda">
      <span><b>Esquerda</b> = foto original (deitada)</span>
      <span><b>Direita</b> = versão IA no ar</span>
      <span><span class="tag">revisar</span> = tipo onde a IA pode alterar bico/tiras</span>
    </div>
  </header>
  ${secoes}
  <footer>Gerado a partir das originais preservadas no Git e das saídas em fotos-ia/. Total conferível: ${feitos} produtos.</footer>
</div>`;

const destino = "C:/Users/Gustavo/AppData/Local/Temp/claude/C--Users-Gustavo/b2b052de-9825-4423-a97f-5374103d4b2a/scratchpad/comparativo.html";
writeFileSync(destino, html);
console.log("gerado:", Math.round(html.length / 1024) + "KB |", feitos, "produtos |", Object.keys(porCat).length, "categorias");
