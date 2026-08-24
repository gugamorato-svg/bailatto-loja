import fs from "node:fs";

// 1) horário nos dados da loja
let site = fs.readFileSync("src/lib/site.ts", "utf8");
if (!site.includes("horario")) {
  site = site.replace(
    "} as const;",
    `  horario: {
    semana: "Segunda a sexta, 9h às 18h",
    sabado: "Sábado, 9h às 13h",
  },
} as const;`
  );
  fs.writeFileSync("src/lib/site.ts", site);
  console.log("site.ts: horário adicionado");
}

// 2) horário nos dados estruturados da home (busca local do Google)
let home = fs.readFileSync("src/app/page.tsx", "utf8");
if (!home.includes("openingHoursSpecification")) {
  home = home.replace(
    "    sameAs: [SITE.instagram],",
    `    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "13:00",
      },
    ],
    sameAs: [SITE.instagram],`
  );
  // remove o comentário que dizia que o horário não era conhecido
  home = home.replace(
    "  // Sem horário de funcionamento (ainda não confirmado) e sem a nota do Google:\n  // declarar avaliação de terceiro como própria é proibido pelo Google.",
    "  // Sem a nota do Google: declarar avaliação de terceiro como própria é proibido."
  );
  fs.writeFileSync("src/app/page.tsx", home);
  console.log("home: horário no JSON-LD");
}

// 3) horário visível no rodapé
let footer = fs.readFileSync("src/components/Footer.tsx", "utf8");
if (!footer.includes("Seg a sex")) {
  footer = footer.replace(
    "            <li>★ 5,0 no Google</li>",
    `            <li>
              Seg a sex, 9h às 18h
              <br />
              Sábado, 9h às 13h
            </li>
            <li>★ 5,0 no Google</li>`
  );
  fs.writeFileSync("src/components/Footer.tsx", footer);
  console.log("rodapé: horário visível");
}
