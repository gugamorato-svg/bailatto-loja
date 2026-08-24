import fs from "node:fs";
const BT = String.fromCharCode(96); // crase, para montar o JSX sem aninhar template

// pagina de confirmacao do cliente
const pc = "src/app/pedido/[id]/page.tsx";
let a = fs.readFileSync(pc, "utf8");
const de = "<span>Frete · {DELIVERY_LABEL[order.delivery.method]}</span>";
const para =
  "<span>\n              Frete · {order.delivery.transportadora ?? DELIVERY_LABEL[order.delivery.method]}\n            </span>";
if (a.includes(de)) { fs.writeFileSync(pc, a.replace(de, para)); console.log("pedido: OK"); }
else console.log("pedido: marcador nao encontrado");

// detalhe no painel
const pa = "src/app/admin/pedidos/[id]/page.tsx";
let b = fs.readFileSync(pa, "utf8");
const de2 = '          <p className="text-text">{DELIVERY_LABEL[order.delivery.method]}</p>';
const para2 =
  '          <p className="text-text">\n' +
  "            {DELIVERY_LABEL[order.delivery.method]}\n" +
  "            {order.delivery.transportadora ? " + BT + " · ${order.delivery.transportadora}" + BT + ' : ""}\n' +
  "          </p>";
if (b.includes(de2)) { fs.writeFileSync(pa, b.replace(de2, para2)); console.log("admin: OK"); }
else console.log("admin: marcador nao encontrado");
