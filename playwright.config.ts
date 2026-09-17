import { defineConfig, devices } from "@playwright/test";

/**
 * Roda contra o site publicado por padrão, porque é lá que os dados reais
 * (catálogo no Supabase, cotação da SuperFrete) existem. Para testar local:
 *   BASE_URL=http://localhost:3000 npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://bailatto.com.br",
    trace: "retain-on-failure",
  },
  projects: [
    // Contas puras (estoque, status do pedido): sem navegador, rodam uma vez.
    { name: "unidade", testMatch: /\.unit\.spec\.ts$/ },
    {
      name: "desktop",
      testIgnore: /\.unit\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    // A maior parte do tráfego vem do navegador do Instagram, no celular.
    {
      name: "mobile",
      testIgnore: /\.unit\.spec\.ts$/,
      use: { ...devices["Pixel 7"] },
    },
  ],
});
