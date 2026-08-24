import { NextResponse } from "next/server";
import { cotarFrete } from "@/lib/frete";

export const dynamic = "force-dynamic";

/**
 * Cotação para o checkout. Recebe o CEP e a quantidade de pares;
 * o token da SuperFrete fica só aqui no servidor.
 */
export async function POST(request: Request) {
  let cep = "";
  let pares = 1;

  try {
    const body = (await request.json()) as { cep?: string; pares?: number };
    cep = String(body.cep ?? "");
    pares = Number(body.pares ?? 1);
  } catch {
    return NextResponse.json({ opcoes: [], erro: "Requisição inválida." }, { status: 400 });
  }

  if (!Number.isFinite(pares) || pares < 1) pares = 1;
  pares = Math.min(pares, 20);

  const { opcoes, erro } = await cotarFrete(cep, pares);
  return NextResponse.json({ opcoes, erro });
}
