import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: join(tmpdir(), "dashboard-playwright"),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3091", trace: "retain-on-failure" },
  webServer: {
    command: "npm run start:e2e",
    url: "http://127.0.0.1:3091/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgres://dashboard:dashboard@127.0.0.1:5436/dashboard",
      APP_ORIGIN: "http://127.0.0.1:3091",
      INITIAL_ADMIN_PASSWORD:
        process.env.INITIAL_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026",
    },
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
});
