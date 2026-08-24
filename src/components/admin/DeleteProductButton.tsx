"use client";

import { deleteProductAction } from "@/app/admin/actions";

export function DeleteProductButton({ id }: { id: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!confirm("Excluir este produto? Esta ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-text-2 hover:text-wine">
        Excluir
      </button>
    </form>
  );
}
