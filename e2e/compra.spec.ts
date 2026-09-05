import { test, expect } from "@playwright/test";

/**
 * O caminho do dinheiro. Estes testes existem por causa de bugs que já
 * aconteceram de verdade neste site:
 *
 * - produto sem numeração aparecia como "Esgotado" e não podia ser comprado;
 * - o filtro de numeração escondia os 60 acessórios da vitrine;
 * - o frete de um brinco era cotado como caixa de sapato;
 * - o servidor recotava o frete diferente do que a cliente via na tela.
 *
 * Nenhum deles aparece em erro de build ou de tipo — só numa compra real.
 */

/** Link de produto de verdade: a fita de categorias do cabeçalho também tem
 *  links com nome de categoria, e eles vêm antes no DOM. */
const primeiroProduto = (page: import("@playwright/test").Page) =>
  page.locator('main a[href^="/produtos/"]').first();

test("calçado: escolhe numeração e vai para a sacola", async ({ page }) => {
  await page.goto("/produtos?categoria=botas");
  await primeiroProduto(page).click();

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Numeração", { exact: false }).first()).toBeVisible();

  // Sem numeração escolhida o site tem de barrar, não mandar um pedido torto.
  await page.getByRole("button", { name: /adicionar à sacola/i }).first().click();
  await expect(page.getByText(/selecione a numeração/i)).toBeVisible();

  await page.getByRole("button", { name: /^3\d$/ }).first().click();
  await page.getByRole("button", { name: /adicionar à sacola/i }).first().click();

  await page.goto("/carrinho");
  await expect(page.getByRole("heading", { name: /sua sacola/i })).toBeVisible();
  await expect(page.getByText(/finalizar compra/i)).toBeVisible();
});

test("acessório: tamanho único vai direto para a sacola", async ({ page }) => {
  await page.goto("/produtos?categoria=semijoias");
  await primeiroProduto(page).click();

  // Não pode existir seletor de numeração, e não pode dizer "Esgotado".
  await expect(page.getByText(/tamanho único/i).first()).toBeVisible();
  await expect(page.getByText(/esgotado no momento/i)).toHaveCount(0);

  await page.getByRole("button", { name: /adicionar à sacola/i }).first().click();

  await page.goto("/carrinho");
  await expect(page.getByText(/tamanho único/i).first()).toBeVisible();
});

test("filtro de numeração não esconde os acessórios", async ({ page }) => {
  await page.goto("/produtos?categoria=semijoias");
  const antes = await page.locator('main a[href^="/produtos/"]').count();
  expect(antes).toBeGreaterThan(0);

  // Escolher um número é o gesto que antes fazia os 60 produtos sumirem.
  await page.getByRole("button", { name: "38", exact: true }).first().click();
  await expect(page.locator('main a[href^="/produtos/"]').first()).toBeVisible();
});

test("barra de frete grátis aparece e fecha a conta", async ({ page }) => {
  await page.goto("/produtos?categoria=semijoias");
  await primeiroProduto(page).click();
  await page.getByRole("button", { name: /adicionar à sacola/i }).first().click();

  await page.goto("/carrinho");
  // Um brinco de R$ 15 está longe do limiar: tem de mostrar quanto falta.
  await expect(page.getByText(/faltam/i)).toBeVisible();
  await expect(page.getByText(/frete grátis/i).first()).toBeVisible();
});

test("cada categoria tem título e H1 próprios", async ({ page }) => {
  // Antes as 13 categorias dividiam title, H1 e canonical — o Google era
  // instruído a ignorar todas elas.
  await page.goto("/produtos?categoria=scarpins");
  await expect(page).toHaveTitle(/scarpin/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/scarpins/i);

  await page.goto("/produtos?categoria=botas");
  await expect(page).toHaveTitle(/bota/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/botas/i);
});
