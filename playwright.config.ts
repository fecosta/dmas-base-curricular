import { defineConfig, devices } from "@playwright/test";
import { localSupabase } from "./tests/e2e/local-supabase";

const supabase = localSupabase();
const port = Number(process.env.E2E_PORT ?? 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("E2E_PORT must be a valid unprivileged port");
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.E2E_PRODUCTION ? `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}` : `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabase.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabase.key,
      APP_URL: baseURL,
    },
    timeout: 120_000,
  },
});
