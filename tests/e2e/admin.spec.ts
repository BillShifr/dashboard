import { expect, test } from "@playwright/test";

const password =
  process.env.INITIAL_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026";

test("admin creates a user and opens the report list", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Логин").fill("admin");
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/presets/);

  await page.getByRole("link", { name: "Администрирование" }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(
    page.getByRole("heading", { name: "Новый пользователь" }),
  ).toBeVisible();

  const login = `e2e${Date.now()}`;
  await page.locator("#new-name").fill("E2E пользователь");
  await page.locator("#new-login").fill(login);
  await page.locator("#new-role").selectOption("viewer");
  await page.locator("#new-password").fill("E2e-password-12");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.locator(`input[value="${login}"]`)).toBeVisible();

  await page.getByRole("button", { name: "Отчёты" }).click();
  await expect(page).toHaveURL(/section=reports/);
  await expect(page.getByRole("heading", { name: "Все отчёты" })).toBeVisible();
});
