import * as XLSX from "xlsx";
import { lerPlanilhaPhibo, sugerirProduto } from "../src/lib/phibo.ts";

// planilha fake no mesmo formato que vimos no Phibo
const linhas = [
  { Marca:"FABRICA", NCM:"64029990", "Código":"SCARP V V 05", "Cód. Barra":"321", "Descrição Produto":"SCARPIN VERMELHO VERNIZ", Grade:36, Cor:"Vermelho", "Gênero":"Feminino", "Valor Un Custo":30, "Valor Un Venda":139.9, Qtde:2 },
  { Marca:"FABRICA", NCM:"64029990", "Código":"SCARP V V 05", "Cód. Barra":"322", "Descrição Produto":"SCARPIN VERMELHO VERNIZ", Grade:37, Cor:"Vermelho", "Gênero":"Feminino", "Valor Un Custo":30, "Valor Un Venda":139.9, Qtde:1 },
  { Marca:"FABRICA", NCM:"64029990", "Código":"SCARP V V 05", "Cód. Barra":"323", "Descrição Produto":"SCARPIN VERMELHO VERNIZ", Grade:38, Cor:"Vermelho", "Gênero":"Feminino", "Valor Un Custo":30, "Valor Un Venda":139.9, Qtde:0 },
  { Marca:"FABRICA", NCM:"64029990", "Código":"BOTA CAM 02", "Cód. Barra":"400", "Descrição Produto":"BOTA CAMURCA CANO CURTO", Grade:35, Cor:"Caramelo", "Gênero":"Feminino", "Valor Un Custo":80, "Valor Un Venda":189.9, Qtde:3 },
  { Marca:"FABRICA", NCM:"64029990", "Código":"BOTA CAM 02", "Cód. Barra":"401", "Descrição Produto":"BOTA CAMURCA CANO CURTO", Grade:36, Cor:"Caramelo", "Gênero":"Feminino", "Valor Un Custo":80, "Valor Un Venda":189.9, Qtde:1 },
  { Marca:"FABRICA", NCM:"64029990", "Código":"CHIN CON 01", "Cód. Barra":"500", "Descrição Produto":"CHINELO CONCHA", Grade:39, Cor:"Branco", "Gênero":"Feminino", "Valor Un Custo":15, "Valor Un Venda":39.9, Qtde:5 },
];
const ws = XLSX.utils.json_to_sheet(linhas);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Estoque");
const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });

const { itens, aviso } = lerPlanilhaPhibo(buf);
console.log("aviso:", aviso ?? "(nenhum)");
console.log("itens agrupados:", itens.length);
for (const i of itens) {
  console.log(` - ${i.key} | ${i.descricao} | R$${i.preco} | estoque ${JSON.stringify(i.estoque)} (total ${i.totalEstoque})`);
}

// sugestao contra os nomes reais do site
const produtos = [
  { slug:"scarpin-vermelho-verniz", name:"Scarpin Vermelho Verniz Salto Alto" },
  { slug:"bota-caramelo-camurca-fivela", name:"Bota Cano Curto Caramelo em Camurça" },
  { slug:"rasteira-nude-strass", name:"Rasteira Slide Nude com Tiras de Strass" },
];
console.log("\nsugestoes automaticas:");
for (const i of itens) {
  console.log(` - ${i.descricao} (${i.cor}) => ${sugerirProduto(i, produtos) ?? "(nenhuma)"}`);
}
