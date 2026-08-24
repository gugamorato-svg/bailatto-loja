import fs from "node:fs";
const p = "src/app/produtos/[slug]/page.tsx";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  'import { AddToCart } from "@/components/AddToCart";',
  'import { AddToCart } from "@/components/AddToCart";\nimport { CalculadoraFrete } from "@/components/CalculadoraFrete";'
);

// entra logo abaixo do botão de comprar, antes do bloco de garantias
const de = `          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">`;
const para = `          <CalculadoraFrete />

          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">`;

if (!s.includes(de)) throw new Error("bloco de garantias nao encontrado");
s = s.replace(de, para);

// as garantias de entrega agora vivem na calculadora — evita repetir a mesma info
s = s.replace(
  `const GARANTIAS = [
  ["🏪", "Retirada grátis na loja", enderecoCompleto],
  ["🛵", "Entrega em São Carlos", "R$ 15,00, combinada no WhatsApp"],
  ["📦", "Enviamos para todo o Brasil", "frete calculado pelo seu CEP"],
  ["↩️", "7 dias para troca", "direito de arrependimento garantido por lei"],
];`,
  `const GARANTIAS = [
  ["🏪", "Loja física em São Carlos", enderecoCompleto],
  ["↩️", "7 dias para troca", "direito de arrependimento garantido por lei"],
  ["💬", "Atendimento pessoal", "tire dúvidas de numeração no WhatsApp"],
];`
);

fs.writeFileSync(p, s);
console.log("1.3 OK — frete na página do produto");
