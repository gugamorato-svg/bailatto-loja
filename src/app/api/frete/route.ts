import { NextResponse } from "next/server";
import { cotarFrete } from "@/lib/frete";

export const dynamic = "force-dynamic";

/**
 * Cotação para o checkout. Recebe o CEP, a quantidade de pares de calçado e o
 * peso das miudezas (semijoia, lenço, carteira) — que não podem ser cotadas
 * como caixa de sapato. O token da SuperFrete fica só aqui no servidor.
 */
export async function POST(request: Request) {
  let cep = "";
  let pares = 1;
  let pesoMiudos = 0;
  let volumoso = false;

  try {
    const body = (await request.json()) as {
      cep?: string; pares?: number; pesoMiudos?: number; volumoso?: boolean;
    };
    cep = String(body.cep ?? "");
    pares = Number(body.pares ?? 1);
    pesoMiudos = Number(body.pesoMiudos ?? 0);
    volumoso = Boolean(body.volumoso);
  } catch {
    return NextResponse.json({ opcoes: [], erro: "Requisição inválida." }, { status: 400 });
  }

  // pares pode ser 0: carrinho só com semijoia/acessório.
  if (!Number.isFinite(pares) || pares < 0) pares = 0;
  pares = Math.min(pares, 20);
  if (!Number.isFinite(pesoMiudos) || pesoMiudos < 0) pesoMiudos = 0;
  pesoMiudos = Math.min(pesoMiudos, 10);

  const { opcoes, erro } = await cotarFrete(cep, pares, pesoMiudos, volumoso);
  return NextResponse.json({ opcoes, erro });
}
