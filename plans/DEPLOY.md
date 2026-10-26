# Shipping openalex.org on Nuxt (#1689)

How the merged `oxjob-1689-nuxt` branch goes live on Heroku app `openalex-gui`, how to undo it in
one command, and the Cloudflare changes proposed to go with it. Written 2026-10-15 by the build-qa
track. Nothing here has been run against production yet; every step below is for the ship night.

## 1. What changes on Heroku, and why it fits

| | Today (release v1736, Vue CLI) | Nuxt branch |
|---|---|---|
| Build command | `npm run build` = `vue-cli-service build` (31 s) | `npm run build` = `nuxt build` with a 6 GB heap (29 s on desk, peak RSS 3.7 GB) |
| Node / npm | `>=17.2.0` resolves to Node 24.21.0; npm 11.19.0 (Heroku default) | pinned: `engines` `node 24.x`, `npm 11.x` (npm 10 crashes installing Nuxt 4.5) |
| Web process | no Procfile: `npm start` falls back to `node server.js` (Express) | `Procfile`: `web: NODE_OPTIONS=--max-old-space-size=512 node .output/server/index.mjs` (Nitro; listens on `$PORT`; heap cap below) |
| Slug | 143 MB | `.output` is 92 MB and self-contained (its own traced `node_modules`); `heroku-cleanup` deletes the root `node_modules` after the build, so the slug stays about the same size |
| Dynos | 5 x Standard-1X (512 MB) | 5 x Standard-2X (1 GB): an SSR server process reaches ~450 to 500 MB under load (trial: 490 MB RSS at 60 concurrent requests) |
| Server-side API key | none (the server never called the API) | SSR calls api.openalex.org from the dynos. Without a key every call spends the dyno IP's free budget ($0.10/day) and then gets 429 (desk's ran out at 08:40 CT on 2026-10-15). The record-ssr track reads `NUXT_SSR_API_KEY`, falling back to `ASSISTANT_PAGES_API_KEY`, which is already set on the app; set `NUXT_SSR_API_KEY` only to give SSR its own key |
| Sentry source maps | Public `.map` next to every JS file; Sentry fetches them via `sourceMappingURL` (nothing is uploaded: `webpack.config.js` had the Sentry upload plugin, but `vue-cli-service` never reads that file) | Same: `sourcemap.client: true` puts 118 maps (16 MB) in `/_nuxt/`, served with the same 1-year immutable cache. Server maps stay off (they caused the trial's out-of-memory build) |

**Build memory.** Heroku builds can use about 12 GB ([Heroku limits](https://devcenter.heroku.com/articles/limits):
"Builds have a maximum memory limit of ~12 GB"). The build script raises Node's heap to 6 GB
(`NODE_OPTIONS=--max-old-space-size=6144`, which for the build replaces the app's
`NODE_OPTIONS=--openssl-legacy-provider`; Vite doesn't need that flag). With browser source maps on
and server maps off, the build peaked at 3.7 GB RSS on desk. No Modal build is needed.

**Server heap cap (merge track).** One Node process per dyno. Uncapped, V8 grows lazily: a 90-wide burst
took one process to 1.1 to 1.4 GB RSS on desk (record-ssr), which on a 1 GB Standard-2X means R14 swapping.
With `--max-old-space-size=384` the same burst peaked at 329 MB RSS with the same results. The Procfile sets
**512 MB**: a third more old-space than the tested cap, while old-space + young generation (~32-64 MB) + code
and buffers outside the heap (rendered HTML, compression, sockets) still leave ~400 MB of the dyno's 1,024 MB
free, so a burst slows down in GC instead of swapping. The merge track re-measured the burst at 512 (see
`work/build-merge.md` in the job). Admission control (`SSR_MAX_CONCURRENT_RENDERS`, 12) bounds the rest.
A Heroku `NODE_OPTIONS` config var (the app had `--openssl-legacy-provider` for webpack) is overridden by
the Procfile's inline value at runtime; the build sets its own (6 GB).

**Server checked standalone.** A copy of `.output` in `/tmp` (no `node_modules` anywhere above it) served:
work page 200 with the record in the HTML, home 200, `/W2741809807` 301 to `/works/W2741809807`,
`/nope.txt` and `/_nuxt/missing.js` 404, and `/_nuxt/*.js` with `Content-Encoding: br` and
`cache-control: public, max-age=31536000, immutable`.

**Removed in this branch:** `vue.config.js`, `webpack.config.js`, `babel.config.js`, `server.js`
(the Nitro server replaces it; the parity track ported its behaviours) and `vuecli-index.html` (the
old `public/index.html`; parity ported its boot skeleton and Zendesk setup). `npm run lint` now calls
`eslint` directly; `npm run dev` / `serve` run `nuxt dev` on port 8080 as before (8081 to 8085 still
switch API hosts: `npm run dev -- --port 8081`).

**Vue CLI packages removed (merge track, after the five tracks merged).** Run with npm 11.21
(`npx -y npm@11 uninstall --package-lock-only ...`, then `npm ci` into a fresh `node_modules`):
removed `@vue/cli-plugin-babel @vue/cli-plugin-eslint @vue/cli-plugin-router @vue/cli-plugin-vuex
@vue/cli-service @babel/plugin-proposal-optional-chaining @sentry/webpack-plugin webpack-bundle-analyzer
webpack-plugin-vuetify sass-loader express heroku-ssl-redirect @achrinza/node-ipc core-js @unhead/ssr unhead`;
added `@babel/preset-env@^7` (eslint's parser config names it; v8 needs `@babel/core` 8) and
**`unplugin@^3.4.0`**: `@nuxt/vite-builder` 4.5.2 imports `unplugin` without declaring it, and `nuxt build`
failed with "Cannot find package 'unplugin'" once the Vue CLI packages stopped hoisting `unplugin@1` to the
root. Kept `compression` (the front door uses it). Both notes are in `package.json` `//deps-notes`.
npm 11.21 no longer runs dependencies' install scripts unless allowed (`esbuild`, `fsevents`,
`@parcel/watcher` are listed as skipped); the build and the server work without them (checked from a clean
`npm ci`). If Heroku's npm 11.x behaves differently, the build log will show it.

## 2. Ship steps

1. **Before.** On the merged branch: `npx vitest run` green, `npm run build` succeeds, and the QA
   harness (section 4) shows no new red against production. Write down the live release:
   `heroku releases -a openalex-gui -n 1` (v1736 on 2026-10-15; whatever is newest on the night).
2. **Resize first.** `heroku ps:type web=standard-2x -a openalex-gui`. This restarts today's Vue CLI
   dynos on bigger dynos, which changes nothing else, so a dyno-size problem can't be mistaken for a
   Nuxt problem. Optional and read-only for the app: `heroku labs:enable log-runtime-metrics -a openalex-gui`
   to see per-dyno memory in the logs (R14 warnings appear either way).
3. **Deploy.** Fast-forward `master` to the merged branch and push; Heroku auto-deploys. In the
   build log expect `Resolving node version 24.x`, `npm 11.x`, `nuxt build`, `Procfile declares
   types -> web`. Preboot is off, so all five dynos restart together (a few seconds of 503s, as on
   every deploy today).
4. **Check the origin** (bypasses Cloudflare). Since #1782 the app turns away requests that skip
   Cloudflare (herokuapp.com gets a 301 to openalex.org), so these send the origin key Cloudflare
   adds; never paste it anywhere else:
   ```
   K=$(heroku config:get ORIGIN_SHARED_SECRET -a openalex-gui | cut -d, -f1)
   curl -s -H "x-openalex-origin-key: $K" https://openalex-gui.herokuapp.com/works/W2741809807 | grep -c "The state of OA"   # >= 1
   curl -sI -H "x-openalex-origin-key: $K" https://openalex-gui.herokuapp.com/W2741809807 | head -1                           # 301
   curl -sI -H "x-openalex-origin-key: $K" https://openalex-gui.herokuapp.com/no-such-file.png | head -1                      # 404
   OPENALEX_SITE_ORIGIN_KEY="$K" node scripts/qa/site-qa.mjs --targets live=https://openalex-gui.herokuapp.com             # whole site
   heroku logs -a openalex-gui --dyno web -n 200 | grep -E "Listening|R14|R15|ssr-error"
   ```
5. **Purge Cloudflare** once the new release answers (only matters after the HTML cache rule in
   section 3 exists; until then Cloudflare caches no HTML).
6. **Watch for 30 minutes.** `ox-errors openalex-gui`, `search-logs openalex-gui ssr-error --since 1h`,
   and the site in a real browser (Cloudflare challenges headless clients on openalex.org).

## 3. Revert: one command

```
heroku releases:rollback v1736 -a openalex-gui     # the release noted in step 1
```

This puts back the previous slug (Vue CLI `dist/` plus `server.js`) and that release's config vars
in about 30 seconds; it does not change dyno size (Standard-2X keeps working for the old app) or
GitHub. **Then stop the next push from redeploying Nuxt:** revert the merge on `master`
(`git revert -m 1 <merge commit>`), or turn off auto-deploy in the Heroku dashboard until the fix is
ready. Purge Cloudflare's HTML cache if the rule in section 3 is live.

## 4. Whole-site QA harness

`scripts/qa/site-qa.mjs` with the route list `scripts/qa/routes.json` (48 routes: home, company pages,
works/authors/sources/institutions/topics lists with filters and searches, `/q` OQL, each record
type long and short form, a DOI work URL, a missing record, login, signup, OAuth consent, settings
logged out and as the non-admin test account, collections, admin logged out, the aboutness viewer, a
404 page, two missing files, robots.txt). For each route and target it records the raw (no-JS)
response, then loads the page in headless Chrome at 1280 and 400 px: status, console and page
errors, failed requests to the site and OpenAlex APIs, landmark and expected text, Vue hydration
warnings, and screenshots side by side in `compare/`. It blocks Plausible and Sentry ingest so runs
don't count as visits or errors, adds `$OPENALEX_API_KEY` to the browser's api.openalex.org calls
(the pages still run logged out; without it desk's shared keyless budget runs out mid-run and every
page after that shows 429s), and kills any browser tab that grows past 1 GB (desk's memory is shared).

```
source ~/.zshenv
npm run build && NUXT_SSR_API_KEY=$OPENALEX_API_KEY PORT=5391 node .output/server/index.mjs &   # the branch, locally
npm --prefix scripts/qa install                               # playwright-core, once
node scripts/qa/site-qa.mjs                                   # prod origin vs localhost:5391
```

Output: `~/ox/oxdata/search-engines-see-record-pages/qa/<CT timestamp>/report.md`, `results.json`,
`shots/`, `compare/`. `--rereport <run dir>` redoes the composites, pixel diffs and report from a finished run.

## 5. Cloudflare (proposal only; nothing changed)

**Today** (read from the zone 2026-10-15): Business plan; no Cache Rules at all; cache level
"aggressive", browser cache TTL 4 h; tiered cache with smart topology on; no Cache Reserve; no
Worker on openalex.org. Every non-verified-bot request to openalex.org gets a managed challenge
(#876), except company pages and static files (#1486, #1294) and robots.txt (#701); verified bots
skip it. A late transform rule adds `X-OpenAlex-Verified-Assistant` to "AI Assistant" requests
(#1688). So Cloudflare caches only static file extensions today (including `/_nuxt/*.js` and `.css`
once the branch ships) and passes all HTML through.

**Decided 2026-10-15 (Jason): no edge caching for now; that is #1701.** Record HTML is `no-cache` with
`Vary: User-Agent`, because agents get a "Notice to agents" that browsers don't (#1689 agent notice), so
one cached copy can't serve everyone. Proposals A-C below are kept for #1701 and would need that variant
in the cache key.

**Proposal A: cache SSR record HTML at the edge, honoring the origin.** One Cache Rule:

```
when:  http.host eq "openalex.org" and http.request.method in {"GET" "HEAD"}
       and (starts_with(http.request.uri.path, "/works/") or starts_with(http.request.uri.path, "/authors/")
            or ... one clause per SSR record type the record-ssr track turns on)
       and not cf.verified_bot_category eq "AI Assistant"
then:  eligible for cache; edge TTL = use origin Cache-Control; browser TTL = respect origin
```

The origin decides the lifetime (record-ssr track's call): for example
`Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` on a 200 record
page, `no-store` on 5xx and on the SPA fallback when the API call fails, and a short `s-maxage` on
404/410. Today's SPA shells keep `no-cache` (the parity track sets it), so nothing else gets cached.
This is safe because the server always renders logged out (the token lives in `localStorage`, not a
cookie), so one copy serves everyone. AI assistants are excluded so they keep getting #1688's plain
pages (which send `private, no-store` and are never stored). The firewall phase runs before the cache,
so people still pass the managed challenge and verified crawlers still skip it; cached pages just
come back faster and spare the dynos.

**Proposal B: purge on deploy.** A purge has to run after the new dynos answer, or the old dynos
re-fill the cache during the restart. Simplest that is race-free: a Nitro startup plugin that, on
`web.1` only, waits 60 s after boot and then purges the record paths (needs a zone token with "Cache
Purge" in a `CLOUDFLARE_PURGE_TOKEN` config var). Until that exists: purge by hand in ship step 5. A
Heroku release-phase command is the wrong place: it runs before the new dynos start.

**Proposal C: old hashed assets.** Each build deletes the previous `/_nuxt/<hash>` files, so HTML
cached or open before a deploy can ask for chunks the origin no longer has. Three layers cover it:
(1) the purge in B removes old HTML at the edge, and browsers never cache HTML (`max-age=0`);
(2) Cloudflare already holds every asset someone requested before the deploy (1-year immutable,
tiered cache), so a stale page mostly finds its chunks at the edge; (3) for open tabs, Nuxt reloads
the page when a route chunk fails to load (its default `emitRouteChunkError: 'automatic'`), and it
polls `/_nuxt/builds/latest.json` (served `max-age=1`, not cached by Cloudflare) to notice new builds.
Add Cache Reserve for `/_nuxt/*` only if Sentry shows chunk-load errors after deploys; keeping the
previous build's files in the slug is possible (download them in the build) but not worth it yet.
