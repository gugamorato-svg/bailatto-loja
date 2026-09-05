"use client";

import { useEffect, useRef } from "react";
import { verProduto } from "@/lib/eventos";

/**
 * Só dispara o ViewContent. A página de produto é server component, e o evento
 * precisa rodar no navegador — daí este componente sem interface.
 */
export function VerProduto({
  slug,
  name,
  price,
}: {
  slug: string;
  name: string;
  price: number | null;
}) {
  const jaFoi = useRef(false);
  useEffect(() => {
    if (jaFoi.current) return;
    jaFoi.current = true;
    verProduto({ slug, name, price });
  }, [slug, name, price]);
  return null;
}
