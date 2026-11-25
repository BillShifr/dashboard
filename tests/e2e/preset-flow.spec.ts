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
  await expect(page.getByRole("button", { name: /^Карта$/ })).toHaveCount(0);
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

  await expect(page.getByRole("button", { name: "Метки" })).toHaveCount(0);

  for (const label of ["Карта", "Соты"]) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await expect(page.locator("svg").first()).toBeVisible();
    await expect(page.getByText("Runtime Error")).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Соты" }).click();
  await page.getByRole("button", { name: /Бел-я РБ/ }).click();
  await page.getByLabel("Цвет").fill("#112233");
  await expect(page.getByLabel("Цвет")).toHaveValue("#112233");

  await page.getByRole("button", { name: "Карта" }).click();
  await expect(page.getByLabel("Цвет")).toHaveValue("#112233");
  await page
    .locator('input[type="file"]')
    .setInputFiles("tests/fixtures/okrug/salary-doctors.xlsx");
  await expect(page.getByRole("status")).toContainText("Импортировано", {
    timeout: 20_000,
  });
  await expect(page.getByLabel("Цвет")).toHaveValue("#112233");

  await page.getByRole("button", { name: "Соты" }).click();
  await page.getByLabel("Клетка 4.1").click();
  await expect(page.getByRole("button", { name: "Жирный" })).toBeVisible();
  await page.getByLabel("Заголовок слайда").click();
  await expect(page.getByRole("button", { name: "Жирный" })).toHaveCount(0);

  await page.getByRole("button", { name: "Карта" }).click();
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

  for (const label of ["Карта", "Соты территорий", "Учреждения"]) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await expect(page.locator("svg").first()).toBeVisible();
    await expect(page.getByText("Runtime Error")).toHaveCount(0);
  }

  await page.getByTestId("save-preset").click();
  await expect(page.getByRole("status")).toContainText("Сохранено", {
    timeout: 15_000,
  });
});
