"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

export function PixPagamento({
  codigo,
  qrCode,
  valor,
}: {
  codigo: string;
  qrCode: string;
  valor: number;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      // navegador antigo: seleciona o texto para a cliente copiar à mão
      const campo = document.getElementById("pix-codigo") as HTMLTextAreaElement | null;
      campo?.select();
      document.execCommand?.("copy");
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 3000);
  }

  return (
    <div className="mt-8 rounded-[2px] border border-wine/30 bg-surface p-6">
      <h2 className="font-serif text-xl text-text">Pague agora com Pix</h2>
      <p className="mt-1 text-sm text-text-2">
        Valor: <strong className="text-wine">{formatPrice(valor)}</strong>
      </p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCode}
          alt="QR Code para pagamento via Pix"
          width={200}
          height={200}
          className="rounded-[2px] bg-white p-2"
        />

        <div className="w-full flex-1">
          <p className="text-sm text-text-2">
            Abra o app do seu banco, escolha <strong className="text-text">Pix</strong> e
            aponte para o QR Code — ou use o código abaixo:
          </p>

          <textarea
            id="pix-codigo"
            readOnly
            value={codigo}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 w-full resize-none rounded-[2px] border border-border bg-bg p-3 font-mono text-xs text-text-2"
          />

          <button
            type="button"
            onClick={copiar}
            className="mt-3 w-full rounded-[2px] bg-wine px-6 py-3 text-sm font-medium uppercase tracking-wide text-on-wine transition-colors hover:bg-wine-2"
          >
            {copiado ? "Código copiado ✓" : "Copiar código Pix"}
          </button>
        </div>
      </div>

      <p className="mt-5 border-t border-border pt-4 text-xs text-text-2">
        Depois de pagar, <strong className="text-text">mande o comprovante no WhatsApp</strong> para
        confirmarmos e separarmos o seu pedido. O pagamento cai direto na conta da loja.
      </p>
    </div>
  );
}
