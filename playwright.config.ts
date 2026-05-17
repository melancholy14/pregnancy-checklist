import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: isCI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    video: isCI ? "retain-on-failure" : "off",
  },
  webServer: {
    command:
      "[ -d out ] || npm run build && ln -sfn . out/pregnancy-checklist && npx serve out -l 3000",
    port: 3000,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
