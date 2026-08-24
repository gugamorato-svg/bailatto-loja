// Gera o mockup do novo front-end (artefato de validação) com as fotos reais
// embutidas como data URI, no padrão editorial das grandes marcas.
import { readFileSync, writeFileSync } from "node:fs";

const prods = JSON.parse(readFileSync(new URL("../_mock-uri.json", import.meta.url), "utf8"));
const catLabel = { scarpins: "Scarpins", sandalias: "Sandálias", rasteirinhas: "Rasteirinhas", botas: "Botas", mocassins: "Mocassins", chinelos: "Chinelos" };
const preco = (p) => "R$ " + p.toFixed(2).replace(".", ",");
const by = (c) => prods.filter((p) => p.c === c);

const scarpins = by("scarpins");
const hero = scarpins.find((p) => /rosa/i.test(p.n)) || scarpins[0];
const novos = scarpins.filter((p) => p !== hero).slice(0, 4);
const trip = [by("sandalias")[0], by("rasteirinhas")[0], by("botas")[0]].filter(Boolean);
const usados = new Set([hero, ...novos, ...trip]);
const favoritos = prods.filter((p) => !usados.has(p)).slice(0, 4);

const card = (p) => `
      <a class="card" href="#">
        <div class="card-img"><img src="${p.uri}" alt="${p.n}" loading="lazy"></div>
        <div class="card-meta">
          <span class="card-name">${p.n}</span>
          <span class="card-price">${preco(p.p)}</span>
        </div>
      </a>`;

const tripItem = (p) => `
      <a class="trip" href="#">
        <div class="trip-img"><img src="${p.uri}" alt="${catLabel[p.c]}"></div>
        <span class="trip-label">${catLabel[p.c]}</span>
        <span class="trip-cta">Ver tudo</span>
      </a>`;

const html = `<title>BAILATTO — Nova Vitrine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500&display=swap">
<style>
  :root {
    --paper:#FBFAF8; --ink:#1A1613; --muted:#8C8279; --line:#ECE7E0;
    --wine:#6E2438; --card:#F4F0EA;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper:#141110; --ink:#F1EBE4; --muted:#9A8F86; --line:#2A2421;
      --wine:#D98BA0; --card:#1D1917;
    }
  }
  :root[data-theme="dark"] {
    --paper:#141110; --ink:#F1EBE4; --muted:#9A8F86; --line:#2A2421;
    --wine:#D98BA0; --card:#1D1917;
  }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--paper); color:var(--ink); font-family:"Jost",system-ui,sans-serif; font-weight:300; -webkit-font-smoothing:antialiased; line-height:1.6; }
  img { display:block; max-width:100%; }
  a { color:inherit; text-decoration:none; }
  .serif { font-family:"Bodoni Moda",Georgia,serif; }
  .eyebrow { font-size:0.66rem; letter-spacing:0.28em; text-transform:uppercase; color:var(--muted); font-weight:400; }

  header { position:sticky; top:0; z-index:20; background:color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
  .bar { max-width:1240px; margin:0 auto; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:20px 28px; gap:20px; }
  nav.left, nav.right { display:flex; gap:26px; align-items:center; }
  nav.right { justify-content:flex-end; }
  .navlink { font-size:0.72rem; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink); opacity:0.75; transition:opacity .2s; }
  .navlink:hover { opacity:1; }
  .wordmark { font-family:"Bodoni Moda",serif; font-size:1.7rem; letter-spacing:0.42em; text-align:center; padding-left:0.42em; }
  @media (max-width:760px){ nav.left{display:none;} .bar{grid-template-columns:auto 1fr;} nav.right{gap:18px;} .wordmark{font-size:1.35rem;letter-spacing:0.3em;text-align:left;} }

  .hero { max-width:1240px; margin:0 auto; display:grid; grid-template-columns:1.05fr 1fr; align-items:center; }
  .hero-copy { padding:80px 60px; }
  .hero-copy h1 { font-family:"Bodoni Moda",serif; font-weight:400; font-size:clamp(2.6rem,5vw,4.4rem); line-height:1.04; letter-spacing:-0.01em; margin:22px 0 26px; text-wrap:balance; }
  .hero-copy h1 em { font-style:italic; color:var(--wine); }
  .hero-copy p { color:var(--muted); max-width:32ch; font-size:1.02rem; }
  .btn { display:inline-block; margin-top:34px; font-size:0.72rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink); border-bottom:1px solid var(--ink); padding-bottom:6px; transition:color .2s,border-color .2s; }
  .btn:hover { color:var(--wine); border-color:var(--wine); }
  .hero-img { aspect-ratio:4/5; overflow:hidden; }
  .hero-img img { width:100%; height:100%; object-fit:cover; }
  @media (max-width:820px){ .hero{grid-template-columns:1fr;} .hero-copy{padding:54px 28px 40px;order:2;} .hero-img{order:1;aspect-ratio:3/4;} }

  section.block { max-width:1240px; margin:0 auto; padding:78px 28px; }
  .sec-top { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:40px; }
  .sec-top h2 { font-family:"Bodoni Moda",serif; font-weight:400; font-size:clamp(1.7rem,3.4vw,2.5rem); letter-spacing:-0.01em; }
  .sec-top a { font-size:0.7rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--line); padding-bottom:4px; white-space:nowrap; }
  .sec-top a:hover { color:var(--wine); border-color:var(--wine); }

  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px 18px; }
  @media (max-width:900px){ .grid{grid-template-columns:repeat(2,1fr);gap:12px;} }
  .card-img { aspect-ratio:4/5; overflow:hidden; background:var(--card); }
  .card-img img { width:100%; height:100%; object-fit:cover; transition:transform .7s cubic-bezier(.2,.7,.2,1); }
  .card:hover .card-img img { transform:scale(1.05); }
  .card-meta { padding:14px 2px 4px; display:flex; flex-direction:column; gap:5px; }
  .card-name { font-size:0.74rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink); transition:color .2s; }
  .card:hover .card-name { color:var(--wine); }
  .card-price { font-size:0.9rem; color:var(--muted); font-family:"Bodoni Moda",serif; }

  .trip-wrap { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  @media (max-width:760px){ .trip-wrap{grid-template-columns:1fr;} }
  .trip { position:relative; overflow:hidden; aspect-ratio:3/4; display:flex; align-items:flex-end; }
  .trip-img { position:absolute; inset:0; }
  .trip-img img { width:100%; height:100%; object-fit:cover; transition:transform .8s cubic-bezier(.2,.7,.2,1); }
  .trip:hover .trip-img img { transform:scale(1.06); }
  .trip::after { content:""; position:absolute; inset:0; background:linear-gradient(to top, rgba(20,14,12,.55), transparent 55%); }
  .trip-label, .trip-cta { position:relative; z-index:2; color:#fff; }
  .trip-label { font-family:"Bodoni Moda",serif; font-size:1.6rem; padding:0 24px 6px; }
  .trip-cta { position:absolute; bottom:26px; right:24px; font-size:0.66rem; letter-spacing:0.2em; text-transform:uppercase; opacity:.85; border-bottom:1px solid rgba(255,255,255,.6); padding-bottom:3px; }

  .band { background:var(--card); }
  .band-in { max-width:900px; margin:0 auto; padding:88px 28px; text-align:center; }
  .band-in h2 { font-family:"Bodoni Moda",serif; font-weight:400; font-style:italic; font-size:clamp(1.8rem,4vw,3rem); line-height:1.2; margin:18px 0 20px; text-wrap:balance; }
  .band-in p { color:var(--muted); max-width:52ch; margin:0 auto; }
  .band-stats { display:flex; justify-content:center; gap:56px; margin-top:44px; flex-wrap:wrap; }
  .band-stats .n { font-family:"Bodoni Moda",serif; font-size:1.9rem; color:var(--wine); }
  .band-stats .l { font-size:0.68rem; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted); margin-top:4px; }

  footer { border-top:1px solid var(--line); }
  .foot-in { max-width:1240px; margin:0 auto; padding:56px 28px; display:flex; justify-content:space-between; gap:24px; flex-wrap:wrap; align-items:center; }
  .foot-in .wm { font-family:"Bodoni Moda",serif; font-size:1.2rem; letter-spacing:0.4em; padding-left:0.4em; }
  .foot-in .addr { font-size:0.8rem; color:var(--muted); max-width:40ch; }

  .note { max-width:1240px; margin:0 auto 40px; padding:0 28px; }
  .note .inner { border:1px dashed var(--line); border-radius:2px; padding:16px 20px; font-size:0.82rem; color:var(--muted); }
  .note strong { color:var(--wine); }
</style>

<header>
  <div class="bar">
    <nav class="left">
      <a class="navlink" href="#">Scarpins</a>
      <a class="navlink" href="#">Sandálias</a>
      <a class="navlink" href="#">Rasteirinhas</a>
    </nav>
    <div class="wordmark">BAILATTO</div>
    <nav class="right">
      <a class="navlink" href="#">Buscar</a>
      <a class="navlink" href="#">Sacola (0)</a>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="hero-copy">
    <span class="eyebrow">Nova coleção · Verão 2026</span>
    <h1>O par certo <em>combina</em> com você.</h1>
    <p>Calçados femininos escolhidos a dedo, do trabalho à festa. Retirada grátis em São Carlos ou entrega para todo o Brasil.</p>
    <a class="btn" href="#">Ver a coleção</a>
  </div>
  <div class="hero-img"><img src="${hero.uri}" alt="${hero.n}"></div>
</section>

<section class="block">
  <div class="sec-top">
    <div><span class="eyebrow">Recém-chegados</span><h2>Novidades da loja</h2></div>
    <a href="#">Ver tudo</a>
  </div>
  <div class="grid">${novos.map(card).join("")}</div>
</section>

<section class="block" style="padding-top:0">
  <div class="trip-wrap">${trip.map(tripItem).join("")}</div>
</section>

<section class="band">
  <div class="band-in">
    <span class="eyebrow">A loja</span>
    <h2>Uma loja de verdade, no coração de São Carlos.</h2>
    <p>Cada cliente é única. A gente ajuda você a encontrar o par perfeito — com atendimento de perto, de quem entende de sapato e adora o que faz.</p>
    <div class="band-stats">
      <div><div class="n serif">5,0★</div><div class="l">no Google</div></div>
      <div><div class="n serif">151</div><div class="l">modelos</div></div>
      <div><div class="n serif">São Carlos</div><div class="l">loja física</div></div>
    </div>
  </div>
</section>

<section class="block">
  <div class="sec-top">
    <div><span class="eyebrow">Seleção</span><h2>Os queridinhos</h2></div>
    <a href="#">Ver tudo</a>
  </div>
  <div class="grid">${favoritos.map(card).join("")}</div>
</section>

<footer>
  <div class="foot-in">
    <div class="wm">BAILATTO</div>
    <div class="addr">Rua Geminiano Costa, 416 — Centro, São Carlos-SP · Seg a sex 9h–18h · Sáb 9h–13h</div>
  </div>
</footer>

<div class="note"><div class="inner"><strong>Mockup para validação.</strong> As fotos são as atuais, recortadas em retrato — servem só para conferir o layout. Elas ficam boas de verdade quando refizermos as imagens (fundo neutro, produto grande) com a API. A direção visual segue o padrão de Andrea Gomez, Ferragamo, Arezzo, Santa Lolla e Larroudé: fundo claro, tipografia editorial (Bodoni + Jost), cartão limpo sem molduras nem selos, muito espaço em branco. O vinho da BAILATTO fica como fio único de identidade.</div></div>
`;

const destino = "C:/Users/Gustavo/AppData/Local/Temp/claude/C--Users-Gustavo/b2b052de-9825-4423-a97f-5374103d4b2a/scratchpad/frontend.html";
writeFileSync(destino, html);
console.log("gerado:", Math.round(html.length / 1024) + "KB", "|", "hero:", hero.n, "| novos:", novos.length, "| tríptico:", trip.length, "| favoritos:", favoritos.length);
