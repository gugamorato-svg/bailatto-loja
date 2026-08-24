import fs from "node:fs";
import path from "node:path";
import { lerCsvPhibo, sugerir, precoBR } from "../src/lib/phibo.ts";

const DIR = "C:/Users/Gustavo/Desktop/Sapatos Bailatto";
const itens = lerCsvPhibo(fs.readFileSync("C:/Users/Gustavo/Downloads/estoque.csv", "utf8"));

const fotos = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();

let ok = 0, duvida = 0, ruim = 0;
const linhas = [];
for (const foto of fotos) {
  const nome = path.parse(foto).name.replace(/\s*\(\d+\)$/, "");
  const s = sugerir(nome, itens, 2);
  const top = s[0];
  const marca = !top ? "!!" : top.score >= 0.7 ? "OK" : top.score >= 0.45 ? "??" : "!!";
  if (marca === "OK") ok++; else if (marca === "??") duvida++; else ruim++;
  linhas.push(
    `${marca} ${nome}\n   ${top ? `${(top.score*100).toFixed(0)}% ${top.item.descricao} / ${top.item.cor} — ${precoBR(top.item.preco)} — ${top.item.total} pares — tam ${Object.entries(top.item.tamanhos).filter(([,q])=>q>0).map(([t,q])=>t+":"+q).join(" ")}` : "sem candidato"}` +
    (s[1] ? `\n   alt ${(s[1].score*100).toFixed(0)}% ${s[1].item.descricao} / ${s[1].item.cor} — ${precoBR(s[1].item.preco)}` : "")
  );
}
console.log(linhas.join("\n"));
console.log(`\n=== ${fotos.length} fotos: ${ok} certeiras, ${duvida} a confirmar, ${ruim} sem match ===`);
