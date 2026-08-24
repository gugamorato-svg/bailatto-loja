import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminListProducts, isDbConfigured } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { categoryLabel } from "@/lib/products";
import { logoutAction } from "./actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel — BAILATTO" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const configured = isDbConfigured();
  const products = configured ? await adminListProducts() : [];

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-serif text-xl tracking-[0.25em] text-text-2">BAILATTO</p>
          <h1 className="font-serif text-3xl text-text">Painel da loja</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/pedidos" className="text-sm text-text-2 hover:text-wine">
            Pedidos
          </Link>
          <Link href="/admin/importar" className="text-sm text-text-2 hover:text-wine">
            Importar do Phibo
          </Link>
          <Link href="/" className="text-sm text-text-2 hover:text-wine">
            Ver loja ↗
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-text-2 hover:text-wine">
              Sair
            </button>
          </form>
        </div>
      </div>

      {!configured && (
        <div className="mt-6 rounded-[2px] border border-wine/40 bg-surface p-4 text-sm text-text-2">
          ⚠️ Banco de dados ainda não conectado. Assim que as chaves do Supabase
          forem configuradas, seus produtos aparecerão aqui.
        </div>
      )}

      {sp?.ok && (
        <p className="mt-6 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          Produto salvo! ✓
        </p>
      )}
      {sp?.importados && (
        <p className="mt-6 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          Importação concluída: {sp.importados} produto(s) atualizado(s) com preço e estoque do Phibo ✓
        </p>
      )}
      {sp?.deleted && (
        <p className="mt-6 rounded-[2px] border border-border bg-surface p-3 text-sm text-text-2">
          Produto excluído.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-text-2">{products.length} produto(s)</p>
        <Link
          href="/admin/produtos/novo"
          className="rounded-[2px] bg-wine px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          + Adicionar produto
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[2px] border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-text-2">
            <tr>
              <th className="p-3 font-medium">Foto</th>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Categoria</th>
              <th className="p-3 font-medium">Preço</th>
              <th className="p-3 font-medium">Destaque</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-14 w-11 rounded-[2px] object-cover" />
                  ) : (
                    <div className="h-14 w-11 rounded-[2px] ph-gradient" />
                  )}
                </td>
                <td className="p-3 text-text">{p.name}</td>
                <td className="p-3 text-text-2">{categoryLabel(p.category)}</td>
                <td className="p-3 text-wine">{formatPrice(p.promoPrice ?? p.price)}</td>
                <td className="p-3">{p.featured ? "★" : "—"}</td>
                <td className="p-3 text-text-2">{p.active ? "Ativo" : "Oculto"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-4">
                    <Link href={`/admin/produtos/${p.id}`} className="text-wine hover:underline">
                      Editar
                    </Link>
                    <DeleteProductButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
            {configured && products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-text-2">
                  Nenhum produto ainda. Clique em “Adicionar produto”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
