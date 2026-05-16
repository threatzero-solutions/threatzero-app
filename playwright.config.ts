import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL the tests target. Override with PLAYWRIGHT_BASE_URL when the
 * default Vite port (5173) is already taken and Vite fell back to 5174.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // KC session is per-context; isolating per worker
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // KC in the integration environment is fronted by a self-signed
    // tailscale cert. Tests talk directly to the frontend over http, but
    // the app redirects to KC over https.
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No webServer block — local runs reuse whatever Vite is already on.
});
