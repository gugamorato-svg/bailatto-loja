import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminListProducts, lerImportTemp } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { sugerirProduto, type PhiboItem } from "@/lib/phibo";
import { aplicarImportacao } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Revisar importação — BAILATTO" };

type Temp = { itens: PhiboItem[]; arquivo?: string };

export default async function RevisarPage({
  searchParams,
}: PageProps<"/admin/importar/revisar">) {
  await requireAdmin();
  const sp = await searchParams;

  const temp = await lerImportTemp<Temp>();
  const produtos = await adminListProducts();

  if (!temp || temp.itens.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-text">
          Nenhuma planilha para revisar
        </h1>
        <p className="mt-3 text-text-2">
          Envie o arquivo do Phibo para começar.
        </p>
        <Link
          href="/admin/importar"
          className="mt-6 inline-block rounded-[2px] bg-wine px-6 py-3 text-sm uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          Importar do Phibo
        </Link>
      </section>
    );
  }

  const opcoes = produtos.map((p) => ({ slug: p.slug, name: p.name }));
  // já vinculado antes? mantém. senão, tenta adivinhar pelo nome.
  const escolhaInicial = (item: PhiboItem): string => {
    const jaVinculado = produtos.find((p) => p.phibo === item.key);
    if (jaVinculado) return jaVinculado.slug;
    return sugerirProduto(item, opcoes) ?? "";
  };

  const comSugestao = temp.itens.filter((i) => escolhaInicial(i)).length;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-10">
      <Link href="/admin/importar" className="text-sm text-text-2 hover:text-wine">
        ← Enviar outra planilha
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-text">Revisar importação</h1>
      <p className="mt-2 text-text-2">
        {temp.itens.length} produto(s) na planilha · {comSugestao} com
        correspondência sugerida. Confira cada linha e ajuste onde precisar.
      </p>

      {sp?.erro && (
        <p className="mt-4 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          {sp.erro}
        </p>
      )}

      <div className="mt-4 rounded-[2px] border border-border bg-surface p-4 text-sm text-text-2">
        As sugestões são um palpite baseado no nome — os códigos do Phibo são
        abreviados, então <strong className="text-text">confira antes de
        confirmar</strong>. Deixe em “Não importar” o que não corresponder a
        nenhum produto do site.
      </div>

      <form action={aplicarImportacao} className="mt-6">
        <div className="overflow-x-auto rounded-[2px] border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-text-2">
              <tr>
                <th className="p-3 font-medium">Produto no Phibo</th>
                <th className="p-3 font-medium">Preço</th>
                <th className="p-3 font-medium">Estoque</th>
                <th className="p-3 font-medium">Produto do site</th>
              </tr>
            </thead>
            <tbody>
              {temp.itens.map((item) => {
                const inicial = escolhaInicial(item);
                const numeracoes = Object.entries(item.estoque)
                  .filter(([, q]) => q > 0)
                  .sort((a, b) => Number(a[0]) - Number(b[0]));

                return (
                  <tr key={item.key} className="border-t border-border align-top">
                    <td className="p-3">
                      <span className="block text-text">
                        {item.descricao || item.codigo}
                      </span>
                      <span className="block text-xs text-text-2">
                        {item.codigo}
                        {item.cor ? ` · ${item.cor}` : ""}
                      </span>
                    </td>
                    <td className="p-3 text-wine">{formatPrice(item.preco)}</td>
                    <td className="p-3 text-text-2">
                      {numeracoes.length === 0 ? (
                        <span className="text-xs">sem estoque</span>
                      ) : (
                        <span className="text-xs">
                          {numeracoes.map(([n, q]) => `${n}: ${q}`).join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <input
                        type="hidden"
                        name={`dados_${item.key}`}
                        value={JSON.stringify({
                          key: item.key,
                          preco: item.preco,
                          estoque: item.estoque,
                        })}
                      />
                      <select
                        name={`destino_${item.key}`}
                        defaultValue={inicial}
                        className="w-full min-w-56 rounded-[2px] border border-border bg-bg px-3 py-2 text-text outline-none focus:border-wine"
                      >
                        <option value="">— Não importar —</option>
                        {opcoes.map((o) => (
                          <option key={o.slug} value={o.slug}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-[2px] bg-wine px-8 py-3 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
          >
            Aplicar preços e estoque
          </button>
          <Link href="/admin" className="text-sm text-text-2 hover:text-wine">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
