// Re-records the API responses the assistant-page tests read (oxjob #1688).
// Run from the repo root: ASSISTANT_PAGES_API_KEY=... node assistantPages/fixtures/refresh.mjs
// The key goes in the Authorization header only, so it never lands in a fixture file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assistantPage } from "../index.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURE_PAGES = [
  "/W2741809807",
  "/authors/A5048491430",
  "/sources/S1983995261",
  "/institutions/I136199984",
  "/topics/T13607",
  "/funders/F4320306076",
  "/publishers/P4310320595",
  "/keywords/open-access",
  "/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc",
  "/authors?search=Said+Alvarado-Marin",
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const index = {};
  const recordingFetch = async (url, init) => {
    const res = await fetch(url, init);
    const body = await res.json();
    const u = new URL(url);
    const file = `${(u.pathname + u.search.replace(/&select=[^&]*/, "")).replace(/[^\w.]+/g, "-").replace(/^-|-$/g, "").slice(0, 90)}.json`;
    fs.writeFileSync(path.join(DIR, file), JSON.stringify(body));
    index[url] = { file, status: res.status };
    return new Response(JSON.stringify(body), { status: res.status, headers: { "Content-Type": "application/json" } });
  };
  const env = { VERIFIED_ASSISTANT_TOKEN: "fixture", ASSISTANT_PAGES_API_KEY: process.env.ASSISTANT_PAGES_API_KEY };
  for (const p of FIXTURE_PAGES) {
    const req = { method: "GET", url: new URL(p, "https://openalex.org"), header: (n) => (n === "x-openalex-verified-assistant" ? "fixture" : undefined) };
    const page = await assistantPage(req, env, recordingFetch);
    console.log(page.status, p);
  }
  fs.writeFileSync(path.join(DIR, "index.json"), JSON.stringify(index, null, 1));
}
