import { categories } from "@/lib/products";
import type { AdminProduct } from "@/lib/db";
import { saveProduct } from "@/app/admin/actions";

const ALL_SIZES = [33, 34, 35, 36, 37, 38, 39, 40];
const inputCls =
  "w-full rounded-[2px] border border-border bg-surface px-4 py-2.5 text-text outline-none focus:border-wine";

function moneyToInput(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toFixed(2).replace(".", ",");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      {children}
    </label>
  );
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const sizes = product?.sizes ?? [34, 35, 36, 37, 38, 39];

  return (
    <form action={saveProduct} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="currentImage" value={product?.image ?? ""} />

      <Field label="Nome do produto">
        <input
          name="name"
          defaultValue={product?.name ?? ""}
          required
          placeholder="Ex.: Scarpin Vermelho Verniz Salto Alto"
          className={inputCls}
        />
      </Field>

      <Field label="Categoria">
        <select
          name="category"
          defaultValue={product?.category ?? "scarpins"}
          className={inputCls}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descrição">
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
          placeholder="Uma descrição que desperta desejo…"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Preço (R$) — vazio = 'Sob consulta'">
          <input
            name="price"
            defaultValue={moneyToInput(product?.price)}
            placeholder="Ex.: 139,90"
            className={inputCls}
          />
        </Field>
        <Field label="Preço promocional (opcional)">
          <input
            name="promoPrice"
            defaultValue={moneyToInput(product?.promoPrice)}
            placeholder="Ex.: 99,90"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Numerações disponíveis">
        <div className="flex flex-wrap gap-3">
          {ALL_SIZES.map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-sm text-text">
              <input
                type="checkbox"
                name="sizes"
                value={s}
                defaultChecked={sizes.includes(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Foto do produto">
        {product?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            className="mb-3 h-32 w-24 rounded-[2px] object-cover"
          />
        ) : null}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="block text-sm text-text-2 file:mr-3 file:rounded-[2px] file:border-0 file:bg-wine file:px-4 file:py-2 file:text-on-wine"
        />
        <p className="mt-1 text-xs text-text-2">
          {product ? "Deixe vazio para manter a foto atual." : "Escolha uma foto do produto."}
        </p>
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} />
          Destaque na home
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
          Ativo (visível na loja)
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-[2px] bg-wine px-8 py-3 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          Salvar
        </button>
        <a
          href="/admin"
          className="rounded-[2px] border border-border px-8 py-3 text-sm text-text-2 hover:border-wine hover:text-wine"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
