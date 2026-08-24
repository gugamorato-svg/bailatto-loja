import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { analisarPlanilha } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Importar do Phibo — BAILATTO" };

export default async function ImportarPage({
  searchParams,
}: PageProps<"/admin/importar">) {
  await requireAdmin();
  const sp = await searchParams;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin" className="text-sm text-text-2 hover:text-wine">
        ← Voltar ao painel
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-text">Importar do Phibo</h1>
      <p className="mt-3 text-text-2">
        Atualize os preços e o estoque de todos os produtos de uma vez, usando a
        planilha exportada do Phibo.
      </p>

      {sp?.erro && (
        <p className="mt-6 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          {sp.erro}
        </p>
      )}

      <div className="mt-8 rounded-[2px] border border-border bg-surface p-6">
        <h2 className="font-serif text-lg text-text">Como exportar</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text-2">
          <li>
            No Phibo, vá em <strong className="text-text">Início → Gestão de
            Dados → Estoque → Exportar dados</strong>
          </li>
          <li>Baixe o arquivo e escolha ele aqui embaixo</li>
          <li>Confira os vínculos na tela seguinte e confirme</li>
        </ol>
        <p className="mt-3 text-xs text-text-2">
          O Phibo libera a exportação completa apenas das 8h às 10h10 e a partir
          das 19h10.
        </p>
      </div>

      <form action={analisarPlanilha} className="mt-6">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text">
            Arquivo da planilha (.xlsx, .xls ou .csv)
          </span>
          <input
            type="file"
            name="planilha"
            accept=".xlsx,.xls,.csv"
            required
            className="block w-full text-sm text-text-2 file:mr-3 file:rounded-[2px] file:border-0 file:bg-wine file:px-4 file:py-2 file:text-on-wine"
          />
        </label>
        <button
          type="submit"
          className="mt-6 rounded-[2px] bg-wine px-8 py-3 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          Ler planilha
        </button>
      </form>

      <p className="mt-6 text-sm text-text-2">
        Nada é alterado agora — na próxima tela você revisa e confirma o que
        deve ser atualizado.
      </p>
    </section>
  );
}
