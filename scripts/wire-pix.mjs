import fs from "node:fs";
const p = "src/app/pedido/[id]/page.tsx";
let s = fs.readFileSync(p, "utf8");

// imports
s = s.replace(
  'import { ClearCartOnMount } from "@/components/ClearCartOnMount";',
  'import { ClearCartOnMount } from "@/components/ClearCartOnMount";\nimport { PixPagamento } from "@/components/PixPagamento";\nimport { gerarPixCopiaECola } from "@/lib/pix";\nimport QRCode from "qrcode";'
);

// gera o codigo Pix quando o total ja e conhecido
s = s.replace(
  "  const end = order.delivery;",
  `  const end = order.delivery;

  // Pix só faz sentido quando o total está fechado (frete definido e itens com preço).
  let pix: { codigo: string; qr: string } | null = null;
  if (order.total != null && order.total > 0 && order.status === "aguardando") {
    const codigo = gerarPixCopiaECola(order.total, \`BAILATTO\${order.number}\`);
    pix = {
      codigo,
      qr: await QRCode.toDataURL(codigo, { width: 400, margin: 1 }),
    };
  }`
);

// troca o bloco do WhatsApp: Pix primeiro, WhatsApp como apoio
const de = `      <a
        href={\`https://wa.me/\${WA}?text=\${msg}\`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 block rounded-[2px] bg-wine px-6 py-4 text-center text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
      >
        Combinar pagamento no WhatsApp
      </a>
      <p className="mt-2 text-center text-xs text-text-2">
        Em breve você poderá pagar por Pix direto aqui no site.
      </p>`;

const para = `      {pix ? (
        <PixPagamento codigo={pix.codigo} qrCode={pix.qr} valor={order.total!} />
      ) : null}

      <a
        href={\`https://wa.me/\${WA}?text=\${msg}\`}
        target="_blank"
        rel="noopener noreferrer"
        className={
          pix
            ? "mt-4 block rounded-[2px] border border-wine px-6 py-3 text-center text-sm uppercase tracking-wide text-wine hover:bg-wine hover:text-on-wine"
            : "mt-8 block rounded-[2px] bg-wine px-6 py-4 text-center text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        }
      >
        {pix ? "Enviar comprovante no WhatsApp" : "Combinar pagamento no WhatsApp"}
      </a>`;

if (!s.includes(de)) throw new Error("bloco do WhatsApp nao encontrado");
s = s.replace(de, para);

fs.writeFileSync(p, s);
console.log("Pix ligado na pagina do pedido");
