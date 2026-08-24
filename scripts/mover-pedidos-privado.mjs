// Corrige vazamento: move data/orders.json do bucket público "bailatto" para
// um bucket PRIVADO. Os pedidos já são lidos/gravados com a service key, que
// acessa bucket privado normalmente — então nada no app quebra.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PUB = "bailatto";
const PRIV = "bailatto-privado";
const PATH = "data/orders.json";

// 1. Cria o bucket privado (idempotente)
const { error: eCreate } = await sb.storage.createBucket(PRIV, { public: false });
if (eCreate && !/already exists/i.test(eCreate.message)) throw eCreate;
console.log(eCreate ? "bucket privado já existia" : "bucket privado criado");

// 2. Baixa o orders.json do bucket público
const { data: baixado, error: eDl } = await sb.storage.from(PUB).download(PATH);
if (eDl) throw eDl;
const conteudo = await baixado.text();
const qtd = JSON.parse(conteudo).length;
console.log(`baixados ${qtd} pedidos do bucket público`);

// 3. Sobe para o bucket privado
const { error: eUp } = await sb.storage.from(PRIV).upload(PATH, conteudo, {
  upsert: true, contentType: "application/json",
});
if (eUp) throw eUp;
console.log("gravado no bucket privado");

// 4. Confirma que a cópia privada é ilegível sem autenticação
const urlPriv = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRIV}/${PATH}`;
const rPriv = await fetch(urlPriv);
console.log(`URL pública do bucket privado → HTTP ${rPriv.status} (deve ser 400/404)`);

// 5. Só então remove do bucket público
const { error: eRm } = await sb.storage.from(PUB).remove([PATH]);
if (eRm) throw eRm;
console.log("removido do bucket público");

// 6. Confirma que sumiu do público
const urlPub = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUB}/${PATH}`;
const rPub = await fetch(urlPub);
console.log(`URL pública antiga → HTTP ${rPub.status} (deve ser 400/404 agora)`);
