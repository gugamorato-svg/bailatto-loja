import fs from "node:fs";
const p = "src/app/produtos/[slug]/page.tsx";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  'import { CalculadoraFrete } from "@/components/CalculadoraFrete";',
  `import { CalculadoraFrete } from "@/components/CalculadoraFrete";
import { GuiaNumeracao } from "@/components/GuiaNumeracao";
import { FichaTecnica } from "@/components/FichaTecnica";
import { VoceTambemVaiGostar } from "@/components/VoceTambemVaiGostar";`
);

s = s.replace(
  'import { getProductBySlug } from "@/lib/db";',
  'import { getProductBySlug, getAllProducts } from "@/lib/db";'
);

// carrega o catálogo para o cross-sell
s = s.replace(
  "  const emEstoque = product.estoque",
  "  const relacionados = await getAllProducts();\n\n  const emEstoque = product.estoque"
);

// guia de numeração logo abaixo do seletor
s = s.replace(
  `          <div className="mt-8">
            <AddToCart product={product} />
          </div>`,
  `          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <GuiaNumeracao nomeProduto={product.name} numeracoes={product.sizes} />`
);

// ficha técnica depois das garantias
s = s.replace(
  `          <div className="mt-6 border-t border-border pt-6 text-sm text-text-2">
            <p>
              Dúvidas sobre numeração ou modelos?{" "}`,
  `          <FichaTecnica product={product} />

          <div className="mt-6 border-t border-border pt-6 text-sm text-text-2">
            <p>
              Dúvidas sobre numeração ou modelos?{" "}`
);

// atendimento com horário (3.5) — sem inventar nome de pessoa
s = s.replace(
  `                Fale conosco no WhatsApp
              </a>
              .
            </p>`,
  `                Fale conosco no WhatsApp
              </a>
              . Respondemos de segunda a sexta, 9h às 18h, e sábado até 13h.
            </p>`
);

// cross-sell no fim da página
s = s.replace(
  `        </div>
      </div>
    </section>
  );
}`,
  `        </div>
      </div>

      <VoceTambemVaiGostar atual={product} todos={relacionados} />
    </section>
  );
}`
);

fs.writeFileSync(p, s);
console.log("seção 2 ligada na página de produto");
