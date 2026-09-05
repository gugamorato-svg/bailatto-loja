import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const raiz = process.cwd();
const diretorio = path.join(raiz, "output", "imagegen", "galerias-bailatto-20260903");
const manifest = JSON.parse(fs.readFileSync(path.join(diretorio, "manifest.json"), "utf8"));
const filtro = process.argv[2] || "";
const selecionados = manifest.filter((item) => !filtro || item.category === filtro);
const porPagina = 8;
const larguraColuna = 260;
const alturaImagem = 325;
const alturaLinha = 380;

function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

for (let inicio = 0; inicio < selecionados.length; inicio += porPagina) {
  const lote = selecionados.slice(inicio, inicio + porPagina);
  const linhas = [];

  for (const item of lote) {
    const arquivos = [item.original, item.outputProfile, item.outputAngle];
    const thumbs = await Promise.all(
      arquivos.map(async (arquivo) => {
        if (!fs.existsSync(arquivo)) {
          return sharp({
            create: { width: larguraColuna, height: alturaImagem, channels: 3, background: "#eee9e3" },
          })
            .jpeg()
            .toBuffer();
        }
        return sharp(arquivo)
          .rotate()
          .flatten({ background: "#ffffff" })
          .resize({ width: larguraColuna, height: alturaImagem, fit: "contain", background: "#ffffff" })
          .jpeg({ quality: 82 })
          .toBuffer();
      }),
    );

    const legenda = Buffer.from(`
      <svg width="${larguraColuna * 3}" height="${alturaLinha}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fbfaf8"/>
        <text x="12" y="350" font-family="Arial" font-size="15" fill="#1a1613">${escapar(item.name).slice(0, 76)}</text>
        <text x="12" y="371" font-family="Arial" font-size="12" fill="#6e2438">ORIGINAL</text>
        <text x="272" y="371" font-family="Arial" font-size="12" fill="#6e2438">PERFIL</text>
        <text x="532" y="371" font-family="Arial" font-size="12" fill="#6e2438">OUTRO ÂNGULO</text>
      </svg>`);

    linhas.push(
      await sharp(legenda)
        .composite(thumbs.map((input, indice) => ({ input, left: indice * larguraColuna, top: 0 })))
        .jpeg({ quality: 88 })
        .toBuffer(),
    );
  }

  const pagina = Math.floor(inicio / porPagina) + 1;
  const nome = `auditoria-${filtro || "todos"}-${String(pagina).padStart(2, "0")}.jpg`;
  await sharp({
    create: {
      width: larguraColuna * 3,
      height: alturaLinha * linhas.length,
      channels: 3,
      background: "#fbfaf8",
    },
  })
    .composite(linhas.map((input, indice) => ({ input, left: 0, top: indice * alturaLinha })))
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(diretorio, nome));
}

console.log(`Auditoria: ${selecionados.length} produtos em ${Math.ceil(selecionados.length / porPagina)} página(s).`);

