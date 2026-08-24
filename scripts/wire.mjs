import fs from "node:fs";

// 1) Carrinho: botao principal vai pro checkout
let c = fs.readFileSync("src/app/carrinho/page.tsx", "utf8");
const oldBtn = `          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block rounded-[2px] bg-wine px-6 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
          >
            Finalizar pelo WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-text-2">
            Pagamento por PIX ou cartão — em breve direto no site.
          </p>`;
const newBtn = `          <Link
            href="/checkout"
            className="mt-6 block rounded-[2px] bg-wine px-6 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
          >
            Finalizar compra
          </Link>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-[2px] border border-wine px-6 py-3 text-center text-sm uppercase tracking-wide text-wine hover:bg-wine hover:text-on-wine"
          >
            Prefiro pelo WhatsApp
          </a>`;
if (!c.includes(oldBtn)) throw new Error("botao do carrinho nao encontrado");
c = c.replace(oldBtn, newBtn);
fs.writeFileSync("src/app/carrinho/page.tsx", c);
console.log("carrinho -> checkout OK");

// 2) Painel de produtos: link para Pedidos
let a = fs.readFileSync("src/app/admin/page.tsx", "utf8");
const oldNav = `          <Link href="/" className="text-sm text-text-2 hover:text-wine">
            Ver loja ↗
          </Link>`;
const newNav = `          <Link href="/admin/pedidos" className="text-sm text-text-2 hover:text-wine">
            Pedidos
          </Link>
          <Link href="/" className="text-sm text-text-2 hover:text-wine">
            Ver loja ↗
          </Link>`;
if (!a.includes(oldNav)) throw new Error("nav do admin nao encontrada");
a = a.replace(oldNav, newNav);
fs.writeFileSync("src/app/admin/page.tsx", a);
console.log("admin nav OK");
