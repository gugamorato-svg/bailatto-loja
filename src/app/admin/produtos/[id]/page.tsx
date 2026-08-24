import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminGetProduct, isDbConfigured } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

export default async function EditarProduto({
  params,
  searchParams,
}: PageProps<"/admin/produtos/[id]">) {
  await requireAdmin();
  if (!isDbConfigured()) notFound();

  const { id } = await params;
  const sp = await searchParams;
  const product = await adminGetProduct(id);
  if (!product) notFound();

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <a href="/admin" className="text-sm text-text-2 hover:text-wine">
        ← Voltar ao painel
      </a>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-text">Editar produto</h1>
        <DeleteProductButton id={product.id} />
      </div>

      {sp?.erro && (
        <p className="mt-4 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          {sp.erro}
        </p>
      )}

      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </section>
  );
}
