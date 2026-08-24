/**
 * Leitura da planilha de estoque exportada do Phibo.
 * Funções puras — rodam no navegador (pré-visualização) e no servidor (aplicação).
 */

export type ItemPhibo = {
  chave: string; // "COD||COR" — identifica o item entre importações
  cod: string;
  cor: string;
  descricao: string;
  preco: number;
  /** quantidade por numeração, ex.: { "35": 2, "36": 1 } */
  tamanhos: Record<string, number>;
  total: number;
};

const ACENTOS = /[̀-ͯ]/g;

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(ACENTOS, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** O site e o Phibo usam palavras diferentes para a mesma coisa. */
const SINONIMOS: Record<string, string> = {
  CHANEL: "MULE",
  FLATFORM: "PAPETE",
  RASTEIRINHA: "RASTEIRA",
  COTURNO: "BOTA",
  ROSE: "NUDE",
  CRISTAL: "PRATA",
  CAMURCA: "SUEDE",
  WHITE: "BRANCO",
  MEDIO: "BAIXO",
};

/** Palavras genéricas demais para ajudar na comparação. */
const GENERICAS = new Set([
  "COM", "DE", "DA", "DO", "EM", "E", "A", "O", "SALTO", "BICO",
  "MODELO", "TIRAS", "TIRA", "CANO", "PARES",
]);

function palavras(s: string): string[] {
  return normalizar(s)
    .split(" ")
    .map((t) => SINONIMOS[t] ?? t)
    // "X" e "NÓ" são curtos mas distinguem modelos (RASTEIRA X, RASTEIRA NÓ)
    .filter((t) => t.length >= 1 && !GENERICAS.has(t));
}

/** Lê o CSV do Phibo (separado por ponto e vírgula) e agrupa por produto+cor. */
export function lerCsvPhibo(texto: string): ItemPhibo[] {
  const limpo = texto.replace(/^﻿/, "");
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return [];

  const cabecalho = linhas[0].split(";").map((c) => c.trim());
  const col = (nome: string) => cabecalho.indexOf(nome);
  const iCod = col("Cód. Produto");
  const iDesc = col("Descrição Produto");
  const iPreco = col("Preço Venda");
  const iTam = col("Tam - Grade");
  const iQtd = col("Qtde");
  const iCor = col("Cor - Descrição");
  if (iCod < 0 || iDesc < 0) return [];

  const mapa = new Map<string, ItemPhibo>();
  for (const linha of linhas.slice(1)) {
    const c = linha.split(";");
    const cod = c[iCod]?.trim();
    if (!cod) continue;
    const cor = c[iCor]?.trim() ?? "";
    const chave = `${cod}||${cor}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        cod,
        cor,
        descricao: c[iDesc]?.trim() ?? cod,
        preco: Number(String(c[iPreco] ?? "").replace(",", ".")) || 0,
        tamanhos: {},
        total: 0,
      });
    }
    const item = mapa.get(chave)!;
    const tam = c[iTam]?.trim();
    const qtd = Number(c[iQtd]) || 0;
    if (tam) item.tamanhos[tam] = (item.tamanhos[tam] ?? 0) + qtd;
    item.total += qtd;
  }

  return [...mapa.values()].sort((a, b) =>
    (a.descricao + a.cor).localeCompare(b.descricao + b.cor),
  );
}

/**
 * Quanto o nome do nosso produto combina com um item do Phibo (0 a 1).
 * A cor pesa bastante: "SCARPIN SLINGBACK / Preto" e "/ Branco" só diferem nela.
 */
export function pontuar(nomeSite: string, item: ItemPhibo): number {
  const nossas = new Set(palavras(nomeSite));
  const deles = new Set(palavras(`${item.descricao} ${item.cor}`));
  if (nossas.size === 0 || deles.size === 0) return 0;

  let iguais = 0;
  for (const p of nossas) if (deles.has(p)) iguais++;

  // Dice: leva em conta o tamanho dos DOIS nomes. Com min() um nome curto como
  // "RASTEIRA NÓ" empatava com o correto "RASTEIRA X".
  const base = (2 * iguais) / (nossas.size + deles.size);
  const corBate = item.cor && nossas.has(normalizar(item.cor));
  return Math.min(1, base * (corBate ? 1.15 : 0.9));
}

export type Sugestao = { item: ItemPhibo; score: number };

/** Melhores candidatos do Phibo para um produto do site. */
export function sugerir(
  nomeSite: string,
  itens: ItemPhibo[],
  quantos = 5,
): Sugestao[] {
  return itens
    .map((item) => ({ item, score: pontuar(nomeSite, item) }))
    .filter((s) => s.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, quantos);
}

export function precoBR(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ------------------------------------------------------------------ *
 * Camada usada pelo importador do painel (aceita .xlsx, .xls e .csv)  *
 * ------------------------------------------------------------------ */

import * as XLSX from "xlsx";

export type PhiboItem = {
  key: string;
  codigo: string;
  descricao: string;
  cor: string;
  preco: number | null;
  /** quantidade por numeração */
  estoque: Record<string, number>;
};

/** Acha a coluna pelo nome mesmo com variações de acento/maiúsculas. */
function acharColuna(linha: Record<string, unknown>, ...pistas: string[]): string | null {
  for (const chave of Object.keys(linha)) {
    const c = normalizar(chave);
    if (pistas.every((p) => c.includes(normalizar(p)))) return chave;
  }
  return null;
}

export function lerPlanilhaPhibo(
  buffer: ArrayBuffer,
): { itens: PhiboItem[]; aviso?: string } {
  let linhas: Record<string, unknown>[];
  try {
    const wb = XLSX.read(buffer, { type: "array", raw: false });
    const aba = wb.Sheets[wb.SheetNames[0]];
    if (!aba) return { itens: [], aviso: "A planilha está vazia." };
    linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { defval: "" });
  } catch {
    return { itens: [], aviso: "Não consegui abrir esse arquivo." };
  }
  if (linhas.length === 0) return { itens: [], aviso: "A planilha não tem linhas." };

  const amostra = linhas[0];
  const cCod = acharColuna(amostra, "cod", "produto");
  const cDesc = acharColuna(amostra, "descricao", "produto");
  const cPreco = acharColuna(amostra, "preco", "venda");
  const cTam = acharColuna(amostra, "tam");
  const cQtd = acharColuna(amostra, "qtde") ?? acharColuna(amostra, "quantidade");
  const cCor = acharColuna(amostra, "cor", "descricao");

  if (!cCod || !cDesc) {
    return {
      itens: [],
      aviso:
        "Não achei as colunas de código e descrição. Exporte pelo menu Estoque › Exportar Dados do Phibo.",
    };
  }

  const mapa = new Map<string, PhiboItem>();
  for (const linha of linhas) {
    const codigo = String(linha[cCod] ?? "").trim();
    if (!codigo) continue;
    const cor = cCor ? String(linha[cCor] ?? "").trim() : "";
    const key = `${codigo}||${cor}`;

    if (!mapa.has(key)) {
      const bruto = cPreco ? String(linha[cPreco] ?? "").replace(",", ".") : "";
      const preco = Number(bruto);
      mapa.set(key, {
        key,
        codigo,
        cor,
        descricao: String(linha[cDesc] ?? codigo).trim(),
        preco: Number.isFinite(preco) && preco > 0 ? preco : null,
        estoque: {},
      });
    }

    const item = mapa.get(key)!;
    const tam = cTam ? String(linha[cTam] ?? "").trim() : "";
    const qtd = cQtd ? Number(linha[cQtd]) || 0 : 0;
    if (tam) item.estoque[tam] = (item.estoque[tam] ?? 0) + qtd;
  }

  return { itens: [...mapa.values()].sort((a, b) => a.descricao.localeCompare(b.descricao)) };
}

/** Melhor produto do site para um item da planilha. Devolve o slug, ou null. */
export function sugerirProduto(
  item: PhiboItem,
  opcoes: { slug: string; name: string }[],
): string | null {
  const comoItem: ItemPhibo = {
    chave: item.key,
    cod: item.codigo,
    cor: item.cor,
    descricao: item.descricao,
    preco: item.preco ?? 0,
    tamanhos: item.estoque,
    total: 0,
  };

  let melhor: { slug: string; score: number } | null = null;
  for (const o of opcoes) {
    const score = pontuar(o.name, comoItem);
    if (!melhor || score > melhor.score) melhor = { slug: o.slug, score };
  }
  // Abaixo disso a sugestão erra mais do que ajuda — melhor deixar em branco.
  return melhor && melhor.score >= 0.55 ? melhor.slug : null;
}
