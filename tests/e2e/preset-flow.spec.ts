import { expect, test } from "@playwright/test";

const password =
  process.env.INITIAL_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026";

test("login → create territory preset → save", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Логин").fill("admin");
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/presets/);

  const name = `E2E территория ${Date.now()}`;
  await page.getByTestId("preset-name").fill(name);
  await page.getByTestId("create-preset").click();
  await expect(page).toHaveURL(/\/editor\//);

  await page.getByTestId("save-preset").click();
  await expect(page.getByRole("status")).toContainText("Сохранено", {
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "PNG" }).click();
  await expect(page.getByRole("status")).toContainText(/PNG|Не удалось/, {
    timeout: 15_000,
  });
});
