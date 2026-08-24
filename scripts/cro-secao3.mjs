import fs from "node:fs";

// --- 3.4 a loja física aparece no checkout, junto da opção de retirada ---
const pk = "src/app/checkout/page.tsx";
let k = fs.readFileSync(pk, "utf8");

if (!k.includes("loja.jpg")) {
  const de = `            {metodo !== "retirada" && (`;
  const para = `            {metodo === "retirada" && (
              <a
                href="https://www.google.com/maps/search/?api=1&query=BAILATTO+Cal%C3%A7ados+Rua+Geminiano+Costa+416+S%C3%A3o+Carlos"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex gap-4 rounded-[2px] border border-border bg-surface p-3 transition-colors hover:border-wine"
              >
                {/* Ver a loja bem na hora de entregar os dados é o antídoto do
                    "será que isso existe mesmo?". */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/loja.jpg"
                  alt="Fachada da loja BAILATTO"
                  className="h-20 w-28 shrink-0 rounded-[2px] object-cover"
                />
                <span className="text-sm">
                  <span className="block text-text">Retire na nossa loja</span>
                  <span className="block text-text-2">
                    Rua Geminiano Costa, 416 — Centro, São Carlos-SP
                  </span>
                  <span className="mt-1 block text-wine">Ver no mapa →</span>
                </span>
              </a>
            )}

            {metodo !== "retirada" && (`;

  if (!k.includes(de)) throw new Error("bloco de endereco do checkout nao encontrado");
  k = k.replace(de, para);
  fs.writeFileSync(pk, k);
  console.log("3.4 OK — loja no checkout");
}

// --- 3.4 também na confirmação do pedido ---
const pp = "src/app/pedido/[id]/page.tsx";
let o = fs.readFileSync(pp, "utf8");
if (!o.includes("loja.jpg")) {
  const de = `            <p className="mb-1 font-medium text-text">Retirada na loja</p>
            <p>Rua Geminiano Costa, 416 — Centro, São Carlos-SP</p>`;
  const para = `            <p className="mb-1 font-medium text-text">Retirada na loja</p>
            <div className="mt-2 flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/loja.jpg"
                alt="Fachada da loja BAILATTO"
                className="h-20 w-28 shrink-0 rounded-[2px] object-cover"
              />
              <span>
                Rua Geminiano Costa, 416 — Centro, São Carlos-SP
                <br />
                Seg a sex, 9h às 18h · Sábado, 9h às 13h
                <br />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=BAILATTO+Cal%C3%A7ados+Rua+Geminiano+Costa+416+S%C3%A3o+Carlos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline"
                >
                  Ver no mapa →
                </a>
              </span>
            </div>`;
  if (o.includes(de)) {
    o = o.replace(de, para);
    fs.writeFileSync(pp, o);
    console.log("3.4 OK — loja na confirmação do pedido");
  } else {
    console.log("aviso: bloco de retirada na confirmação não encontrado");
  }
}
