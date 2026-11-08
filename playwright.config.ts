import { defineConfig, devices } from "@playwright/test";

// Uji alur utama pada viewport ponsel. Menjalankan build statis (folder out/).
// Jalankan: npm run build && npm run test:e2e
// Bila browser Playwright tidak terpasang, set PW_CHROME=/path/ke/chrome.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Pixel 7"],
    launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME, args: ["--no-sandbox"] } : {},
  },
  webServer: {
    command: "python3 -m http.server 4173 --directory out",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
