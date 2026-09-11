import { defineConfig, devices } from "@playwright/test";
import { localSupabase } from "./tests/e2e/local-supabase";

const supabase = localSupabase();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.E2E_PRODUCTION ? "npm run build && npm run start -- --hostname 127.0.0.1" : "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabase.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabase.key,
      APP_URL: "http://127.0.0.1:3000",
    },
    timeout: 120_000,
  },
});
