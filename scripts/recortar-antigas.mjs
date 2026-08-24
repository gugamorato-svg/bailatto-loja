import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// As fotos antigas foram tiradas com o mesmo enquadramento: sapato na faixa
// central-superior, mesa vazia embaixo. Um corte fixo a ~30% da altura acerta
// sempre — o corte "automático" do sharp escolhia a mesa branca.
const ORIG = "C:/Users/Gustavo/Downloads/fotos sapatos";
const DEST = "public/produtos";
const TOPO = 0.3;

const MAPA = {
  "20f7067d-a1f0-4232-ba26-b1801a7bc158": "sandalia-caramelo-salto-bloco",
  "303be54b-9c33-485e-b53b-010df6de96c6": "sandalia-slingback-azul-serenity",
  "649f0346-e76b-497a-a7c6-c2f871bf0e54": "sandalia-off-white-salto-bloco",
  "91e8d475-6a77-4269-9e35-0b7ccfc8fef2": "sandalia-preta-tiras-cruzadas",
  "d5f770dc-7fec-4142-8648-9f38d0db8872": "sandalia-preta-croco-strass",
  "b218e2d3-fd60-4850-b6ba-78a4f9de7b7d": "sandalia-flatform-rose-strass",
  "df96a229-55a2-471d-bd2a-8c5c632159a7": "sandalia-flatform-rose-strass-2",
  "003f72c9-0b79-46ac-b119-e1503bdf2a6b": "bota-caramelo-camurca-fivela",
  "79cf0467-c40f-4289-ade5-6ea8f4d0b3c2": "bota-preta-croco",
  "9c34221a-2143-4f3e-8e26-d2edc8fcf37d": "bota-preta-fivelas-tachas",
  "e5d843fd-70f7-44f8-8591-ecaad4f46c1a": "bota-terracota-cano-medio",
  "510a0108-e1da-4b71-a2fa-c7165f3bbab3": "rasteira-nude-strass",
  "8d1a0d84-5404-47cc-a54e-99c6a531d390": "rasteira-prata-cruzada",
  "b12b7f33-df57-4db2-a915-26bc367054eb": "rasteira-dedo-rose-strass",
  "35daa958-63e8-4a18-8d7f-2df63570ad56": "mocassim-off-white-fivela",
  "81e594c4-e565-459c-9402-609f01aff583": "mocassim-cinza-camurca-corrente",
  "b0561b09-7af6-4701-9455-fca10a060740": "mocassim-marrom-fivela",
  "5f1ed54a-506d-4484-b4b4-8a01f20cdc2c": "tenis-preto-plataforma",
  "80f30e20-a12d-4cd1-bca7-ce5f9d88cb96": "tenis-retro-off-white",
  "2ea91ca8-1482-4181-9595-602036f48849": "mule-azul-serenity",
};

let ok = 0;
for (const [uuid, slug] of Object.entries(MAPA)) {
  const origem = path.join(ORIG, uuid + '.jpg');
  if (!fs.existsSync(origem)) { console.log('original faltando:', uuid); continue; }
  const m = await sharp(origem).metadata();

  // 1) tira o teto e a mesa vazios, deixando a faixa onde estao os sapatos
  const topo = Math.round(m.height * 0.18);
  const alt = Math.round(m.height * 0.64);

  // 2) cor da borda dessa faixa -> as tarjas laterais ficam imperceptiveis
  const borda = await sharp(origem)
    .extract({ left: 0, top: topo, width: 100, height: Math.min(200, alt) })
    .stats();
  const bg = {
    r: Math.round(borda.channels[0].mean),
    g: Math.round(borda.channels[1].mean),
    b: Math.round(borda.channels[2].mean),
  };

  // 3) encaixa a foto INTEIRA no 3:2 (nada de sapato cortado)
  await sharp(origem)
    .extract({ left: 0, top: topo, width: m.width, height: alt })
    .resize({ width: 1200, height: 800, fit: 'contain', background: bg })
    .modulate({ brightness: 1.03 })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(DEST, slug + '.jpg'));
  ok++;
}
console.log(ok + ' fotos: sapato inteiro, encaixado no 3:2 sem cortar');
