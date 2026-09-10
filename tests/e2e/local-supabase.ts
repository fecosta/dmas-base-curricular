import { execFileSync } from "node:child_process";

export function localSupabase() {
  const status = JSON.parse(execFileSync("node_modules/.bin/supabase", ["status", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  if (status.API_URL !== "http://127.0.0.1:55321") {
    throw new Error("E2E fixtures require this repository's local Supabase on port 55321");
  }
  return {
    url: status.API_URL as string,
    key: status.PUBLISHABLE_KEY as string,
    secret: status.SECRET_KEY as string,
    mailUrl: status.MAILPIT_URL as string,
  };
}
