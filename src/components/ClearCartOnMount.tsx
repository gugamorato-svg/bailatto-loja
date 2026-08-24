"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Esvazia a sacola quando o pedido é confirmado. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
