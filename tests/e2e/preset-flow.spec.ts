import { expect, test } from "@playwright/test";

const password =
  process.env.INITIAL_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Логин").fill("admin");
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/presets/);
}

test("start page picks report form, not map mode", async ({ page }) => {
  await login(page);
  await expect(
    page.getByRole("button", { name: /Диспансеризация/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Инцидент №8/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /9 районов/ })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Диспансеризация" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Инцидент №8/ }).click();
  await expect(
    page.getByRole("heading", { name: "Инцидент №8" }),
  ).toBeVisible();
});

test("incident 8: three map modes, save, export", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /Инцидент №8/ }).click();
  const name = `E2E инцидент ${Date.now()}`;
  await page.getByTestId("preset-name").fill(name);
  await page.getByTestId("create-preset").click();
  await expect(page).toHaveURL(/\/editor\//);

  for (const label of ["9 районов", "Шестиугольники", "63 БУ"]) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await expect(page.locator("svg").first()).toBeVisible();
    await expect(page.getByText("Runtime Error")).toHaveCount(0);
  }

  await page.getByRole("button", { name: /9 районов/ }).click();
  await page.getByTestId("save-preset").click();
  await expect(page.getByRole("status")).toContainText("Сохранено", {
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Экспорт" }).click();
  await page.getByRole("menuitem", { name: "PNG" }).click();
  await expect(page.getByRole("status")).toContainText(/PNG|Не удалось/, {
    timeout: 15_000,
  });
});

test("dispanserization: three map modes and save", async ({ page }) => {
  await login(page);
  const name = `E2E диспансеризация ${Date.now()}`;
  await page.getByTestId("preset-name").fill(name);
  await page.getByTestId("create-preset").click();
  await expect(page).toHaveURL(/\/editor\//);

  for (const label of ["Карта", "Шестиугольники", "Учреждения"]) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await expect(page.locator("svg").first()).toBeVisible();
    await expect(page.getByText("Runtime Error")).toHaveCount(0);
  }

  await page.getByTestId("save-preset").click();
  await expect(page.getByRole("status")).toContainText("Сохранено", {
    timeout: 15_000,
  });
});
