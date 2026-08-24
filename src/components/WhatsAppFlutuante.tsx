"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

/**
 * Botão fixo de WhatsApp. Fica fora do painel e das telas de fechamento —
 * no checkout ele competiria com o botão de concluir a compra, que é
 * exatamente o vazamento de funil que a auditoria apontou na sacola.
 */
const ROTAS_SEM_BOTAO = ["/admin", "/checkout", "/carrinho"];

export function WhatsAppFlutuante() {
  const pathname = usePathname() ?? "";
  if (ROTAS_SEM_BOTAO.some((r) => pathname.startsWith(r))) return null;

  const mensagem = encodeURIComponent(
    "Olá! Vim pelo site da BAILATTO e gostaria de tirar uma dúvida.",
  );

  return (
    <a
      href={`https://wa.me/${SITE.whatsapp}?text=${mensagem}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a BAILATTO no WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 shadow-lg shadow-black/20 transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="#fff"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a12.06 12.06 0 005.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896A11.82 11.82 0 0020.52 3.45" />
      </svg>
      <span className="hidden text-sm font-medium text-white sm:inline">
        Fale com a gente
      </span>
    </a>
  );
}
