import fs from "node:fs";

let s = fs.readFileSync("src/lib/products.ts", "utf8");

const NEW = {
  "sandalia-flatform-rose-strass": {
    slug: "papete-rose-strass-cristal",
    name: "Papete Rosé com Tiras de Strass Cristal",
    desc: "Conforto de verdade com muito brilho: tiras cravejadas de strass cristal sobre um solado flatform rosé macio. A papete perfeita para o verão, do passeio ao fim de tarde.",
  },
  "sandalia-flatform-rose-strass-2": {
    slug: "papete-rose-strass-dourado",
    name: "Papete Rosé com Tiras de Strass Dourado",
    desc: "O charme do strass rosé-dourado em uma papete leve e confortável. Solado flatform que abraça o pé e combina com tudo — sofisticada sem abrir mão do conforto.",
  },
};

const blocks = [];
for (const oldSlug of Object.keys(NEW)) {
  const start = s.indexOf('  {\n    slug: "' + oldSlug + '",');
  if (start < 0) throw new Error("nao achei " + oldSlug);
  const end = s.indexOf("\n  },\n", start) + "\n  },\n".length;
  let b = s.slice(start, end);
  const n = NEW[oldSlug];
  b = b.replace('slug: "' + oldSlug + '"', 'slug: "' + n.slug + '"');
  b = b.replace(/name: "[^"]*"/, 'name: "' + n.name + '"');
  b = b.replace('category: "sandalias"', 'category: "papete"');
  b = b.replace(/description:\n      "[^"]*",/, 'description:\n      "' + n.desc + '",');
  b = b.replace(/price: [\d.]+,/, "price: 89.90,");
  blocks.push(b);
  s = s.slice(0, start) + s.slice(end);
}

const close = s.lastIndexOf("];");
s = s.slice(0, close) + "\n  // ---------------- Papete ----------------\n" + blocks.join("") + s.slice(close);
s = s.replace(
  "// OBS duplicatas a confirmar: scarpin-branco-verniz-sola-vermelha ~ ...-2\n//                            sandalia-flatform-rose-strass ~ ...-2",
  "// OBS: as 2 papetes rosé sao modelos DIFERENTES (strass cristal vs dourado)."
);
fs.writeFileSync("src/lib/products.ts", s);
console.log("products.ts OK — 2 papetes separadas das sandalias");
