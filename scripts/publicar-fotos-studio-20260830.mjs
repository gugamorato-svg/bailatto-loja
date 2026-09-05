import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const PUBLICAR = process.argv.includes("--publicar-catalogo");
const PUBLICO = path.resolve("public/produtos");
const AUDITORIA = path.resolve("_auditoria-fotos-studio-20260830");
const GERADAS =
  "C:/Users/Gustavo/.codex/generated_images/01a048db-8791-7341-b749-88376afce1c3";
const LARGURA = 1200;
const ALTURA = 1500;
const VERSAO = "studio-20260830";

const FOTOS = [
  ["chinelo-concha-branco", "exec-32940ddb-b37a-47e5-8915-425093f17713.png"],
  ["chinelo-concha-marrom", "exec-1323987f-5ecb-4c54-bc2a-9ae95eee509e.png"],
  ["chinelo-concha-rosa", "exec-988c2033-d778-4b04-88c0-12165a424c8a.png"],
  ["chinelo-concha-verde", "exec-40d99501-af9d-4bf9-bb38-5f1a51ff19d3.png"],
  ["chinelo-simples-dourado", "exec-f631e3d6-308e-47d5-8eab-ec764350e85d.png"],
  ["chinelo-simples-marrom", "exec-f3f63db0-4fda-4f00-adfe-56fa6a043d4b.png"],
  ["chinelo-simples-prata", "exec-55aaf4ba-8334-4f12-9472-3e3fa2410316.png"],
  ["tenis-casual-plataforma-preto", "exec-8c2e7d0f-25c9-4dd0-b545-843335c44e81.png"],
  ["tenis-casual-retro-branco", "exec-c06ea8f7-f0f8-4243-936d-4e0e1a2c9f42.png"],
  ["papete-3-tiras-nude", "exec-81e85428-d689-4bd9-aa30-3d468735cf39.png"],
  ["papete-3-tiras-prata", "exec-b568aea1-c214-448d-8085-ca75450b67ea.png"],
  ["papete-sandalia-brilho-colorido-nude", "exec-7cae9b2f-51d4-4c04-9cc3-199a0f654ab0.png"],
  ["papete-sandalia-preto", "exec-93a624f8-dfb9-474e-8933-2d3015bb7ac6.png"],
  ["sapatilha-laco-cromado-branco", "exec-a1264d64-57c7-442f-a2f9-19e43448ef34.png"],
  ["sapatilha-laco-preto", "exec-9372bda5-2f74-499c-8c42-8ad66af6a155.png"],
  ["sapatilha-napa-2-tiras-marrom", "exec-9b10dbb0-0360-4983-ad26-d35e07f1c901.png"],
  ["sapatilha-napa-no-brilho-preto", "exec-9b4a020f-adc6-4e42-8946-9112e55897ac.png"],
  ["sapatilha-napa-tira-marrom", "exec-b1c80866-9f4c-4b58-b839-b52115e3cddb.png"],
  ["sapatilha-napa-vermelho", "exec-36153dd6-de2d-4e10-8047-2877120bcd78.png"],
  ["sapatilha-no-napa-marrom", "exec-1a711bd6-15a6-4711-b796-1cd70fbe3b71.png"],
  ["sapatilha-no-napa-nude", "exec-e7698b93-a013-468e-899d-c1f9a6cf0bb9.png"],
  ["sapatilha-no-napa-preto", "exec-f7bef776-0842-479f-ae26-6896c88953be.png"],
  ["rasteira-no-cobre", "exec-ddcc90e5-50ee-43e7-982e-91e461ea6a08.png"],
  ["rasteira-no-dourado", "exec-1d7cdd43-4656-42b4-9f12-8ae6a7208fd3.png"],
  ["rasteira-no-prata", "exec-3a4c9f1a-9741-41c7-94e6-4cd4751f2a41.png"],
  ["rasteira-no-preto", "exec-e0d84d3f-774d-4bca-a786-d6e7976ee0c1.png"],
  ["rasteira-x-prata", "exec-43960af3-cfd1-43f5-a624-b02b18d4aa4f.png"],
  ["rasteira-x-dourado", "exec-718c1016-0cf6-43fb-a32a-a4191487423f.png"],
  ["sandalia-rasteira-moeda-dourado", "exec-dba3eb38-81fd-4add-b80e-8be477bee635.png"],
  ["sandalia-rasteira-v-branco", "exec-a733befc-d8db-454b-9915-532c14c255bb.png"],
  ["sandalia-rasteira-bolinha-dourado", "exec-4d329f6e-6284-43cd-88a0-94780b0196c3.png"],
  ["sandalia-rasteira-bolinha-laranja", "exec-9df3fa11-f6ea-43d1-b08f-5d3365b43382.png"],
  ["sandalia-rasteira-bolinha-marrom", "exec-9d45488c-cf1f-4024-9f81-bca2988aa4ee.png"],
  ["sandalia-rasteira-bolinha-verde", "exec-8907f582-3df4-43cf-b353-4e938affc94d.png"],
  ["sandalia-rasteira-onca-branca", "exec-32cd6caa-411d-4eda-a0f9-4338c58210d5.png"],
  ["sandalia-gisele-vermelho", "exec-1772faaf-99a8-41ff-a0e0-4b66a471b9c5.png"],
  ["sandalia-bico-folha-azul", "exec-bfa6bd54-1f59-471a-bf19-a16270c3aa20.png"],
  ["sandalia-bico-folha-nude", "exec-55bcbae4-68d8-4eec-bbd5-101cd6850c8c.png"],
  ["sandalia-bloco-suede-marrom", "exec-99e061fd-615a-47cd-a189-6bf758321fb9.png"],
  ["sandalia-bloco-suede-rosa", "exec-b0ea8118-33a6-460b-ad3a-e777d60b80fd.png"],
  ["sandalia-bloco-x-prata", "exec-9d3c249a-c829-4ae7-875c-bb3980b83c3d.png"],
  ["sandalia-bloco-alto-prata", "exec-bb67f64a-69b0-41b1-afa3-0ac686533485.png"],
  ["sandalia-croco-azul", "exec-4a79da1e-e614-4c14-9c9e-e08a075b6ff3.png"],
  ["sandalia-croco-marrom", "exec-5933c8c5-8471-4840-a6bb-47136f2f4867.png"],
  ["sandalia-croco-preto", "exec-90b3e5dd-7055-4b15-a412-135e67b7a213.png"],
  ["sandalia-croco-vermelho", "exec-83d6a6d3-e82e-496a-9feb-0cf5f36fee27.png"],
  ["sandalia-dedo-alto-marrom", "exec-6a751728-a730-4212-9de0-166fa59ea193.png"],
  ["sandalia-dedo-alto-off-white", "exec-5a593675-9b23-4c83-8f8e-0997697c3489.png"],
  ["sandalia-dedo-alto-preto", "exec-7312b479-bdb7-45d2-9afe-fdeb6d49bc25.png"],
  ["sandalia-dedo-baixo-dourado", "exec-49049781-ad52-4ba6-b86b-86ba8643661b.png"],
  ["sandalia-lezzar-preto", "exec-3cbd7f1c-5a8c-4a67-bfe4-e66319ce4cb3.png"],
  ["sandalia-salto-bloco-suede-branco", "exec-28955f9c-9245-4908-b0d7-4d3d4656474d.png"],
  ["sandalia-salto-bloco-suede-nude", "exec-b39b0abd-5a87-4dcd-b250-8cd546d4d39b.png"],
  ["sandalia-salto-bloco-alto-laranja-colorido", "exec-0f3fa163-2b81-491d-bb80-41d807cd4511.png"],
  ["sandalia-salto-bloco-baixo-x-dourado", "exec-d77974fb-d901-42bf-bb67-5d0e858b62bd.png"],
  ["sandalia-salto-bloco-brilho-cobre", "exec-25fa4e2c-46e6-4924-a619-7c4f288188c0.png"],
  ["sandalia-salto-bloco-brilho-preto", "exec-962141f9-fd75-4e64-9699-b3fe14017373.png"],
  ["sandalia-salto-bloco-glitter-dourado", "exec-bbe3f13b-085b-46af-bd04-5bad9858b59a.png"],
  ["sandalia-salto-bloco-glitter-prata", "exec-94243293-a1cf-4751-8a67-ed77fe46c59f.png"],
  ["sandalia-salto-bloco-liso-caramelo-claro", "exec-c5f9f81a-a26a-4a95-8734-0c090e07ea60.png"],
  ["sandalia-salto-bloco-liso-marrom", "exec-4787639a-dc3c-4d82-92e9-07bcc9a81865.png"],
  ["sandalia-salto-bloco-liso-off-white", "exec-045acb8b-dc7f-47fc-bd60-4bd877339d90.png"],
  ["sandalia-salto-fino-alto-jeans", "exec-121542d8-a721-443e-82bd-c3f63bdfc788.png"],
  ["sandalia-salto-fino-baixo-preto", "exec-a0132dad-5af1-44d4-ba64-0670dc771551.png"],
  ["sandalia-salto-fino-tranca-preto", "exec-cfd38a05-00c8-4046-a30b-2f7611af6536.png"],
  ["sandalia-salto-minimo-1-tira-jeans", "exec-6e30b694-fe73-4787-b200-1e5881d44b65.png"],
  ["sandalia-salto-minimo-1-tira-nude", "exec-8d50b4fd-e7ee-4ee9-b17a-a1c785fe37e9.png"],
  ["sandalia-salto-minimo-1-tira-preto", "exec-69933b26-bd89-495b-8d0f-3ff169fda54d.png"],
  ["sandalia-salto-minimo-x-nude", "exec-c200e694-7a8d-41ec-96d3-79aa4dda5c9d.png"],
  ["sandalia-salto-minimo-x-preto", "exec-0cf6fc84-3bd4-4dbe-9ea2-77b676fe1719.png"],
  ["sandalia-ana-capri-rosa", "exec-cc4bbee9-e9c9-4b57-9a7c-ae23d4466625.png"],
  ["sandalia-dedo-baixo-onca-preto", "exec-1fa75424-8e30-4a0c-95b1-baee10031903.png"],
  ["sandalia-dedo-baixo-prata", "exec-ee88220d-9e69-441a-af4e-7d17ac2cabc7.png"],
  ["sandalia-lezzar-marrom", "exec-42b428c5-7bf7-4a91-8373-740d371323e9.png"],
  ["sandalia-salto-minimo-x-marrom", "exec-f639b8c8-cfde-4baa-b71e-76335e32770f.png"],
  ["scarpin-salto-alto-bloco-verniz-nude", "exec-e3a1b714-86ec-4147-abd0-efb37b937289.png"],
  ["scarpin-salto-alto-glitter-prata", "exec-ae323e6a-883b-4fa0-a7e1-ad6d56edc7c8.png"],
  ["scarpin-salto-alto-glitter-preto", "exec-5910433f-7506-494d-a449-4f1e7eefec2b.png"],
  ["scarpin-salto-alto-glitter-rosa", "exec-fe25e1a7-ce2b-4e54-824b-388dce8bcd7d.png"],
  ["scarpin-salto-alto-jeans", "exec-f58a247b-226b-486e-9e20-363781179a27.png"],
  ["scarpin-salto-alto-napa-azul-baby", "exec-c3752b9c-7ac0-47b6-9ea4-044302ea4c56.png"],
  ["scarpin-salto-alto-napa-azul-escuro", "exec-cda10e45-31ad-4145-9778-be7ba24b415e.png"],
  ["scarpin-salto-alto-napa-caramelo", "exec-21e3653e-cc1c-47d7-bf16-e9b9e90eb286.png"],
  ["scarpin-salto-alto-napa-cinza", "exec-14b482f5-6ea6-4efc-af1a-09d6aa257c2a.png"],
  ["scarpin-salto-alto-napa-marrom", "exec-d9035db6-f357-4ba1-9442-0aeeb89a18fe.png"],
  ["scarpin-salto-alto-napa-off-white", "exec-c5da7864-0d9d-4f7e-b818-d1aab2c6dd78.png"],
  ["scarpin-salto-alto-napa-prata", "exec-ac5051d8-d18f-4c56-8f1d-1cba50f9b3a6.png"],
  ["scarpin-salto-alto-napa-roxo", "exec-5de65a58-c8db-4e27-90c6-d5e2e44a4b6b.png"],
  ["scarpin-salto-alto-napa-verde", "exec-c2e016a3-523c-4dcb-b059-1c79c503a3f2.png"],
  ["scarpin-salto-alto-roxo", "exec-d0330d92-6c50-463e-bb6b-111731df502a.png"],
  ["scarpin-salto-alto-sob-encomenda", "exec-f7b3a866-19f6-4749-96ae-8bd98ce154d5.png"],
  ["scarpin-salto-alto-sob-encomenda-2", "exec-1167ea22-cb38-44b6-9afb-aafd6e73688a.png"],
  ["scarpin-salto-alto-sob-encomenda-3", "exec-654d5174-2e26-444a-8bed-15fe21ecc9cf.png"],
  ["scarpin-salto-alto-sob-encomenda-4", "exec-a803a9f0-2ca8-41e9-9b2d-823cdae503f0.png"],
  ["scarpin-salto-alto-sola-de-onca-vermelho", "exec-2019a40a-69e1-46cc-886e-7f7d6dc9abba.png"],
  ["scarpin-salto-alto-sola-vermelha-branco", "exec-e89e5232-e413-4ef7-a6dd-e64bf4d8ef2a.png"],
  ["scarpin-salto-alto-sola-vermelha-cobra", "exec-e4e540b5-3409-413a-86aa-fc01bac40b24.png"],
  ["scarpin-salto-alto-sola-vermelha-onca", "exec-712385b2-57eb-4ee3-ad2c-fad25f8b658c.png"],
  ["scarpin-salto-alto-verniz-azul", "exec-f82ac82f-4961-44f8-9daf-2edc3d85c9ec.png"],
  ["scarpin-salto-alto-verniz-azul-baby", "exec-47291c8c-f452-49e0-8d0a-d1d3b0793545.png"],
  ["scarpin-salto-alto-verniz-azul-escuro", "exec-7d1b0cc9-7331-435e-97b9-5d5ebe80b428.png"],
  ["scarpin-salto-alto-verniz-cinza", "exec-db40d3d2-6f6b-4df2-b4b7-583b87d12dae.png"],
  ["scarpin-salto-alto-verniz-marrom-claro", "exec-e9a610e5-1a7e-4733-981d-b03924c60d07.png"],
  ["scarpin-salto-alto-verniz-marrom-escuro", "exec-5a187c0e-0d2e-485a-9cfc-ea35b6bc1a35.png"],
  ["scarpin-salto-alto-verniz-nude", "exec-d2a87ce9-eaf2-4971-b958-2a6de37fa391.png"],
  ["scarpin-salto-alto-verniz-preto", "exec-61e4a410-4d4e-4b32-b68c-5e5867ebab9e.png"],
  ["scarpin-salto-alto-verniz-vermelho", "exec-61969452-686d-4e64-956a-0e282ec75976.png"],
  ["scarpin-salto-baixo-bloco-marrom", "exec-dc91f19d-514e-4b6f-9337-0064dd401e78.png"],
  ["scarpin-salto-baixo-bloco-napa-nude", "exec-65abd3fe-1fc3-4d46-88a9-9b3989ed33f1.png"],
  ["scarpin-salto-baixo-bloco-napa-verde", "exec-12b1d03c-747e-4b51-9229-663693c01b41.png"],
  ["scarpin-salto-baixo-bloco-napa-vinho", "exec-796b1c15-00cf-43c5-b677-b0bd16efc3f0.png"],
  ["scarpin-salto-baixo-bloco-onca", "exec-21910950-1ec6-4e4d-ae02-148c5d1a4d2e.png"],
  ["scarpin-salto-baixo-fino-jeans", "exec-a72ccd2a-0bcc-4f22-89fb-d5da4b3f311c.png"],
  ["scarpin-salto-baixo-fino-linho", "exec-7d45bbf6-2e9d-4b76-85cc-0dfe3e9f8dfa.png"],
  ["scarpin-salto-baixo-fino-napa-prata", "exec-ab89ce5a-8c79-454d-bca5-0a0b3a7b4815.png"],
  ["scarpin-salto-baixo-fino-verniz-preto", "exec-011804cb-1c58-4077-8472-d30d7aaae2d3.png"],
  ["scarpin-salto-baixo-fino-verniz-vermelho", "exec-074dea3b-f7da-45ad-94c1-b9b65751f324.png"],
  ["scarpin-salto-baixo-fino-xadrez", "exec-05356f10-486b-4ac3-8f83-152fbda7ca4c.png"],
  ["scarpin-salto-baixo-verniz-branco", "exec-eac1fcd6-608f-4577-8e27-29bbcf75ac7a.png"],
  ["scarpin-salto-medio-bloco-fivela-caramelo", "exec-f1b8fa42-e344-41c3-974a-2b47d2222067.png"],
  ["scarpin-salto-medio-bloco-fivela-nude", "exec-0b17eb7e-36e7-439b-ba4d-e7d2a3a59fde.png"],
  ["scarpin-salto-medio-bloco-fivela-preto", "exec-27c7511c-8b40-492a-8c26-ea02fe2ace85.png"],
];

const catalogoUrl =
  "https://tgnxixkmwgifqrksejgg.supabase.co/storage/v1/object/public/bailatto/data/products.json";

fs.mkdirSync(AUDITORIA, { recursive: true });

const resposta = await fetch(`${catalogoUrl}?t=${Date.now()}`);
if (!resposta.ok) throw new Error(`Falha ao baixar catálogo: HTTP ${resposta.status}`);
const produtos = await resposta.json();
const porSlug = new Map(produtos.map((produto) => [produto.slug, produto]));

for (const [slug, arquivo] of FOTOS) {
  const origem = path.join(GERADAS, arquivo);
  if (!fs.existsSync(origem)) throw new Error(`Imagem gerada ausente: ${origem}`);
  if (!porSlug.has(slug)) throw new Error(`Produto ausente no catálogo: ${slug}`);
}

const alteracoes = [];
for (const [slug, arquivo] of FOTOS) {
  const nomeNovo = `${slug}-${VERSAO}.jpg`;
  const destino = path.join(PUBLICO, nomeNovo);
  await sharp(path.join(GERADAS, arquivo))
    .flatten({ background: "#ffffff" })
    .resize({ width: LARGURA, height: ALTURA, fit: "cover", position: "centre" })
    .jpeg({ quality: 91, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(destino);

  const produto = porSlug.get(slug);
  produto.image = `/produtos/${nomeNovo}`;
  alteracoes.push({ slug, nome: produto.name, imagem: produto.image });
}

const cards = await Promise.all(
  alteracoes.map(async ({ slug, nome }) => {
    const imagem = await sharp(path.join(PUBLICO, `${slug}-${VERSAO}.jpg`))
      .resize({ width: 360, height: 450, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 84 })
      .toBuffer();
    const legenda = Buffer.from(`
      <svg width="360" height="510" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="18" y="482" font-family="Arial" font-size="16" fill="#1a1613">${nome
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")}</text>
      </svg>`);
    return sharp(legenda).composite([{ input: imagem, left: 0, top: 0 }]).jpeg({ quality: 86 }).toBuffer();
  }),
);

await sharp({
  create: {
    width: 360 * 4,
    height: 510 * Math.ceil(cards.length / 4),
    channels: 3,
    background: "#fbfaf8",
  },
})
  .composite(
    cards.map((input, indice) => ({
      input,
      left: (indice % 4) * 360,
      top: Math.floor(indice / 4) * 510,
    })),
  )
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(path.join(AUDITORIA, "chinelos-aprovados.jpg"));

fs.writeFileSync(
  path.join(AUDITORIA, "mapeamento.json"),
  JSON.stringify(alteracoes, null, 2),
);

if (PUBLICAR) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Variáveis do Supabase ausentes.");
  const supabase = createClient(url, chave, { auth: { persistSession: false } });
  const bucket = supabase.storage.from("bailatto");
  const carimbo = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const original = Buffer.from(
    JSON.stringify(await (await fetch(`${catalogoUrl}?b=${Date.now()}`)).json(), null, 2),
  );
  const atualizado = Buffer.from(JSON.stringify(produtos, null, 2));

  const backup = await bucket.upload(`data/backup-products-${carimbo}.json`, original, {
    contentType: "application/json",
    upsert: false,
  });
  if (backup.error) throw backup.error;

  const envio = await bucket.upload("data/products.json", atualizado, {
    contentType: "application/json",
    cacheControl: "60",
    upsert: true,
  });
  if (envio.error) throw envio.error;
  console.log(`Catálogo publicado com ${alteracoes.length} imagens de estúdio.`);
} else {
  console.log("Prévia criada; catálogo ainda não alterado.");
}

console.log(JSON.stringify(alteracoes, null, 2));
