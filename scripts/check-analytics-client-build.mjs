import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Run only after the synthetic production build in test:analytics-build.
const token = "phc_reviewtest";
const directory = ".next/static/chunks";
async function chunks(path) {
  return (await Promise.all((await readdir(path, { withFileTypes: true })).map(async (entry) => {
    const file = join(path, entry.name);
    return entry.isDirectory() ? chunks(file) : entry.name.endsWith(".js") ? [file] : [];
  }))).flat();
}

const matches = [];
for (const file of await chunks(directory)) {
  const output = await readFile(file, "utf8");
  if (!output.includes("https://eu.i.posthog.com/i/v0/e/")) continue;
  // The Capture endpoint locates the real browser boundary, not an unrelated framework chunk.
  const endpoint = output.indexOf('"https://eu.i.posthog.com/i/v0/e/"');
  const starts = [...output.matchAll(/\},(\d+),\d+,[\w$]+=>\{/g)];
  const start = starts.filter((match) => match.index < endpoint).at(-1);
  assert.ok(start, `Cannot isolate analytics client module in ${file}`);
  const end = output.indexOf(`],${start[1]})`, endpoint);
  assert.ok(end > endpoint, `Cannot find end of analytics client module in ${file}`);
  matches.push(output.slice(start.index, end));
}
assert.equal(matches.length, 1, "Expected exactly one analytics client module");
const analytics = matches[0];
assert.ok(analytics.includes(`"${token}"`), "Synthetic PostHog token not inlined into analytics client module");
// A live process.env object in this module can shadow both inlined defaults.
// Direct reads of test-runner flags (env.VITEST etc.) are intentional and safe.
assert.ok(!/\.env(?!\.[\w$])/.test(analytics), "Analytics client retains an indirect runtime process.env lookup");

// Injected test environments may read their own argument; the default branch must be a
// literal build-time value. An alias of process.env instead leaves a runtime property read.
for (const [name, value] of [["NEXT_PUBLIC_POSTHOG_KEY", token], ["NEXT_PUBLIC_VERCEL_ENV", "production"]]) {
  const references = [...analytics.matchAll(new RegExp(`\\.${name}\\b`, "g"))];
  assert.equal(references.length, 1, `Unexpected runtime ${name} read in analytics client module`);
  assert.match(analytics, new RegExp(`\\?\\w+\\.${name}:"${value}"`), `${name} must resolve to a build-time literal on the default path`);
}
console.log("Analytics client build: synthetic public env inlined on the default path.");
