// Edição em massa das fotos de produto com o Alibaba Model Studio (Wan i2i).
//
// Fluxo assíncrono do DashScope: cria a tarefa (X-DashScope-Async: enable),
// recebe um task_id, faz polling em /tasks/{id} até SUCCEEDED, baixa o
// resultado (a URL expira em 24h) e salva em fotos-ia/<slug>.png.
//
// NÃO toca nas fotos originais — grava numa pasta separada para você aprovar
// antes de a gente publicar. Retomável: pula o que já existe.
//
//   node scripts/alibaba-fotos.mjs --teste 3     → só 3, para calibrar
//   node scripts/alibaba-fotos.mjs               → tudo que falta
//
// Precisa em .env.local:
//   DASHSCOPE_API_KEY=...        (a chave que você cria no Model Studio)
//   DASHSCOPE_BASE=...           (opcional; padrão = endpoint internacional)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", raiz), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const CHAVE = env.DASHSCOPE_API_KEY;
if (!CHAVE) {
  console.error("Falta DASHSCOPE_API_KEY no .env.local — crie a chave no Model Studio e cole lá.");
  process.exit(1);
}
// Endpoint internacional (Singapura). Se o seu console mostrar um host próprio
// com WorkspaceId, é só pôr DASHSCOPE_BASE no .env.local que este valor cede.
const BASE = env.DASHSCOPE_BASE || "https://dashscope-intl.aliyuncs.com";
const MODELO = "wan2.5-i2i-preview";

const DESTINO = new URL("fotos-ia/", raiz);
mkdirSync(DESTINO, { recursive: true });

// Mesmo estilo aprovado no front-end e no estudo do Claid: fundo neutro de
// estúdio, produto grande, SEM alterar o sapato.
const PROMPT = [
  "Coloque este calçado sobre um fundo de estúdio liso off-white, sem emenda.",
  "Remova completamente o fundo original (a mesa e o tecido) e qualquer objeto ao redor.",
  "Mantenha o calçado EXATAMENTE como está: mesma cor, material, formato, costuras, fivelas e salto — não invente nem altere nenhum detalhe.",
  "Produto grande e centralizado, com sombra de contato suave e realista embaixo.",
  "Iluminação de estúdio clara e uniforme, sem reflexos duros. Estilo catálogo de e-commerce premium.",
].join(" ");

const NEGATIVO = "pernas, pés, pessoas, manequim, texto, marca d'água, outro calçado, fundo poluído, reflexo forte";

const sono = (ms) => new Promise((r) => setTimeout(r, ms));

async function criarTarefa(imagemUrl) {
  const r = await fetch(`${BASE}/api/v1/services/aigc/image2image/image-synthesis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAVE}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: MODELO,
      input: { prompt: PROMPT, negative_prompt: NEGATIVO, images: [imagemUrl] },
      parameters: { n: 1, size: "1024*1280" }, // 4:5, igual aos cartões novos
    }),
  });
  const texto = await r.text();
  if (!r.ok) {
    const e = new Error(`criar ${r.status}: ${texto.slice(0, 300)}`);
    e.semCredito = /Arrears|quota|balance|billing|Throttling|FreeTierExhausted/i.test(texto);
    throw e;
  }
  const j = JSON.parse(texto);
  if (!j.output?.task_id) throw new Error("sem task_id: " + texto.slice(0, 200));
  return j.output.task_id;
}

async function aguardar(taskId) {
  for (let i = 0; i < 40; i++) {
    await sono(3000);
    const r = await fetch(`${BASE}/api/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${CHAVE}` },
    });
    const j = JSON.parse(await r.text());
    const s = j.output?.task_status;
    if (s === "SUCCEEDED") {
      const url = j.output.results?.[0]?.url;
      if (!url) throw new Error("SUCCEEDED sem url");
      return url;
    }
    if (s === "FAILED") throw new Error("tarefa FAILED: " + (j.output?.message || ""));
  }
  throw new Error("timeout aguardando a tarefa");
}

const produtos = await (
  await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bailatto/data/products.json`)
).json();

const args = process.argv.slice(2);
const limite = args.includes("--teste") ? Number(args[args.indexOf("--teste") + 1]) || 3 : Infinity;
// Slugs explícitos (qualquer arg que não seja flag nem número) rodam só esses.
const slugsPedidos = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] === "--teste"));

const jaFeito = (p) => existsSync(new URL(`${p.slug}.png`, DESTINO));
let faltam = produtos.filter((p) => p.image && !jaFeito(p));
if (slugsPedidos.length) faltam = produtos.filter((p) => slugsPedidos.includes(p.slug));
console.log(`catálogo: ${produtos.length} | faltam: ${faltam.length} | rodando: ${Math.min(limite, faltam.length)}`);

let ok = 0, erros = 0;
for (const p of faltam.slice(0, limite)) {
  const nome = p.slug + ".png";
  const origem = `https://bailatto.com.br${p.image}`;
  const t0 = Date.now();
  try {
    const taskId = await criarTarefa(origem);
    const urlResultado = await aguardar(taskId);
    const buf = Buffer.from(await (await fetch(urlResultado)).arrayBuffer());
    writeFileSync(new URL(nome, DESTINO), buf);
    ok++;
    console.log(`✓ ${String(ok).padStart(3)} ${p.slug}  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${(buf.length / 1024) | 0}KB`);
  } catch (e) {
    erros++;
    console.error(`✗ ${p.slug}: ${e.message.slice(0, 140)}`);
    if (e.semCredito) {
      console.error("\n⚠ Crédito/cota do Alibaba parece ter acabado. Parando — rode de novo depois, ele retoma.");
      break;
    }
  }
}
console.log(`\nfeitas: ${ok} | erros: ${erros} | salvas em fotos-ia/`);
