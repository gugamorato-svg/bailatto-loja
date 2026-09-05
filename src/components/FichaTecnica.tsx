import type { Product } from "@/lib/products";
import { categoryLabel } from "@/lib/products";

/**
 * Os detalhes saem do nome cadastrado (que vem do Phibo: napa, verniz, suede,
 * croco, glitter...). Só entra na lista o que o nome realmente diz — medidas
 * como altura de salto não são inventadas.
 */
function detalhes(p: Product): [string, string][] {
  const n = p.name.toLowerCase();
  const linhas: [string, string][] = [];

  const materiais: [RegExp, string][] = [
    [/verniz/, "Verniz"],
    [/napa/, "Napa"],
    [/suede|camur[çc]a/, "Suede (camurça)"],
    [/croco/, "Textura croco"],
    [/glitter/, "Glitter"],
    [/linho/, "Linho"],
    [/jeans/, "Jeans"],
    [/lezar|lezzar/, "Lezard"],
    [/on[çc]a/, "Estampa onça"],
    [/cobra/, "Estampa cobra"],
    [/xadrez/, "Xadrez"],
  ];
  const material = materiais.find(([re]) => re.test(n));
  if (material) linhas.push(["Material", material[1]]);

  if (/salto alto|alto/.test(n) && !/baixo/.test(n)) linhas.push(["Salto", "Alto"]);
  else if (/salto m[íi]nimo/.test(n)) linhas.push(["Salto", "Mínimo"]);
  else if (/baixo/.test(n)) linhas.push(["Salto", "Baixo"]);
  else if (/rasteira|sapatilha|mocassim/.test(n)) linhas.push(["Salto", "Sem salto"]);

  if (/bloco/.test(n)) linhas.push(["Formato do salto", "Bloco"]);
  else if (/fino/.test(n)) linhas.push(["Formato do salto", "Fino"]);
  else if (/plataforma|flatform|papete/.test(n)) linhas.push(["Solado", "Plataforma"]);

  if (/slingback/.test(n)) linhas.push(["Fechamento", "Slingback (tira atrás)"]);
  else if (/fivela/.test(n)) linhas.push(["Fechamento", "Fivela"]);
  else if (/dedo/.test(n)) linhas.push(["Modelo", "Tira de dedo"]);

  if (/sola vermelha/.test(n)) linhas.push(["Detalhe", "Sola vermelha"]);
  if (/strass|brilho/.test(n)) linhas.push(["Detalhe", "Aplicação de brilho"]);

  linhas.push(["Categoria", categoryLabel(p.category)]);
  if (p.tamanhoUnico) linhas.push(["Tamanho", "Único"]);
  if (p.sizes.length) {
    linhas.push([
      "Numerações",
      p.sizes.length > 1 ? `${p.sizes[0]} ao ${p.sizes[p.sizes.length - 1]}` : String(p.sizes[0]),
    ]);
  }

  return linhas;
}

export function FichaTecnica({ product }: { product: Product }) {
  const linhas = detalhes(product);
  if (linhas.length < 3) return null;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="mb-3 text-sm font-medium text-text">Detalhes</h2>
      <dl className="space-y-1.5 text-sm">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo + valor} className="flex justify-between gap-4">
            <dt className="text-text-2">{rotulo}</dt>
            <dd className="text-right text-text">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
