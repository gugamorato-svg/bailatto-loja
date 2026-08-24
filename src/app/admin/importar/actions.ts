"use server";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  salvarImportTemp,
  limparImportTemp,
  adminApplyImport,
  type ImportUpdate,
} from "@/lib/db";
import { lerPlanilhaPhibo } from "@/lib/phibo";

export async function analisarPlanilha(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const erro = (msg: string) =>
    redirect(`/admin/importar?erro=${encodeURIComponent(msg)}`);

  const file = formData.get("planilha");
  if (!(file instanceof File) || file.size === 0) {
    erro("Escolha o arquivo exportado do Phibo.");
    return;
  }

  let itens;
  try {
    const buffer = await file.arrayBuffer();
    const resultado = lerPlanilhaPhibo(buffer);
    if (resultado.aviso) erro(resultado.aviso);
    itens = resultado.itens;
  } catch {
    erro("Não consegui ler esse arquivo. Ele precisa ser .xlsx, .xls ou .csv.");
    return;
  }

  if (!itens || itens.length === 0) {
    erro("A planilha não tinha nenhum produto com código.");
    return;
  }

  const falha = await salvarImportTemp({
    itens,
    arquivo: file.name,
    em: new Date().toISOString(),
  });
  if (falha) erro(falha);

  redirect("/admin/importar/revisar");
}

export async function aplicarImportacao(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const updates: ImportUpdate[] = [];

  // Cada linha da revisão manda: destino_<key> (slug ou "") e dados_<key> (JSON)
  for (const [campo, valor] of formData.entries()) {
    if (!campo.startsWith("destino_")) continue;
    const slug = String(valor);
    if (!slug) continue; // "não importar"

    const key = campo.slice("destino_".length);
    const bruto = formData.get(`dados_${key}`);
    if (typeof bruto !== "string") continue;

    try {
      const d = JSON.parse(bruto) as {
        key: string;
        preco: number | null;
        estoque: Record<string, number>;
      };
      updates.push({
        slug,
        phibo: d.key,
        price: d.preco,
        estoque: d.estoque ?? {},
      });
    } catch {
      // linha corrompida: ignora em vez de derrubar a importação inteira
    }
  }

  if (updates.length === 0) {
    redirect(
      `/admin/importar/revisar?erro=${encodeURIComponent(
        "Nenhum produto foi vinculado. Escolha ao menos um.",
      )}`,
    );
  }

  const { atualizados, error } = await adminApplyImport(updates);
  if (error) {
    redirect(`/admin/importar/revisar?erro=${encodeURIComponent(error)}`);
  }

  await limparImportTemp();
  redirect(`/admin?importados=${atualizados}`);
}
