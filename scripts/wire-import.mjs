import fs from "node:fs";

// 1) link "Importar do Phibo" no menu do painel + mensagem de sucesso
let a = fs.readFileSync("src/app/admin/page.tsx", "utf8");
const navAntes = `          <Link href="/admin/pedidos" className="text-sm text-text-2 hover:text-wine">
            Pedidos
          </Link>`;
const navDepois = `          <Link href="/admin/pedidos" className="text-sm text-text-2 hover:text-wine">
            Pedidos
          </Link>
          <Link href="/admin/importar" className="text-sm text-text-2 hover:text-wine">
            Importar do Phibo
          </Link>`;
if (!a.includes("admin/importar")) {
  if (!a.includes(navAntes)) throw new Error("nav do admin nao encontrada");
  a = a.replace(navAntes, navDepois);
}
const okAntes = `      {sp?.deleted && (`;
const okDepois = `      {sp?.importados && (
        <p className="mt-6 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          Importação concluída: {sp.importados} produto(s) atualizado(s) com preço e estoque do Phibo ✓
        </p>
      )}
      {sp?.deleted && (`;
if (!a.includes("Importação concluída")) {
  if (!a.includes(okAntes)) throw new Error("bloco de mensagens nao encontrado");
  a = a.replace(okAntes, okDepois);
}
fs.writeFileSync("src/app/admin/page.tsx", a);
console.log("admin: nav + mensagem OK");

// 2) AddToCart: avisar quando nao houver numeracao disponivel
let c = fs.readFileSync("src/components/AddToCart.tsx", "utf8");
const alvo = `  return (
    <div>
      <div className="mb-2 text-sm font-medium text-text">Numeração</div>`;
const novo = `  if (product.sizes.length === 0) {
    return (
      <div className="rounded-[2px] border border-border bg-surface p-4 text-sm text-text-2">
        Esgotado no momento —{" "}
        <a
          href="https://wa.me/5516993392022"
          target="_blank"
          rel="noopener noreferrer"
          className="text-wine hover:underline"
        >
          consulte pelo WhatsApp
        </a>
        .
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-text">Numeração</div>`;
if (!c.includes("Esgotado no momento")) {
  if (!c.includes(alvo)) throw new Error("AddToCart: bloco nao encontrado");
  c = c.replace(alvo, novo);
  fs.writeFileSync("src/components/AddToCart.tsx", c);
}
console.log("AddToCart: aviso de esgotado OK");
