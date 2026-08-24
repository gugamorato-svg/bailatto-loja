export function formatPrice(price: number | null): string {
  if (price == null) return "Sob consulta";
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
