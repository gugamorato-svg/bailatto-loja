import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novo produto — BAILATTO" };

export default async function NovoProduto({
  searchParams,
}: PageProps<"/admin/produtos/novo">) {
  await requireAdmin();
  const sp = await searchParams;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <a href="/admin" className="text-sm text-text-2 hover:text-wine">
        ← Voltar ao painel
      </a>
      <h1 className="mt-4 font-serif text-3xl text-text">Novo produto</h1>

      {sp?.erro && (
        <p className="mt-4 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          {sp.erro}
        </p>
      )}

      <div className="mt-8">
        <ProductForm />
      </div>
    </section>
  );
}
