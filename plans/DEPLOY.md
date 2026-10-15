# Shipping openalex.org on Nuxt (#1689)

How the merged `oxjob-1689-nuxt` branch goes live on Heroku app `openalex-gui`, how to undo it in
one command, and the Cloudflare changes proposed to go with it. Written 2026-10-15 by the build-qa
track. Nothing here has been run against production yet; every step below is for the ship night.

## 1. What changes on Heroku, and why it fits

| | Today (release v1736, Vue CLI) | Nuxt branch |
|---|---|---|
| Build command | `npm run build` = `vue-cli-service build` (31 s) | `npm run build` = `nuxt build` with a 6 GB heap (29 s on desk, peak RSS 3.7 GB) |
| Node / npm | `>=17.2.0` resolves to Node 24.21.0; npm 11.19.0 (Heroku default) | pinned: `engines` `node 24.x`, `npm 11.x` (npm 10 crashes installing Nuxt 4.5) |
| Web process | no Procfile: `npm start` falls back to `node server.js` (Express) | `Procfile`: `web: node .output/server/index.mjs` (Nitro; listens on `$PORT`) |
| Slug | 143 MB | `.output` is 92 MB and self-contained (its own traced `node_modules`); `heroku-cleanup` deletes the root `node_modules` after the build, so the slug stays about the same size |
| Dynos | 5 x Standard-1X (512 MB) | 5 x Standard-2X (1 GB): an SSR server process reaches ~450 to 500 MB under load (trial: 490 MB RSS at 60 concurrent requests) |
| Sentry source maps | Public `.map` next to every JS file; Sentry fetches them via `sourceMappingURL` (nothing is uploaded: `webpack.config.js` had the Sentry upload plugin, but `vue-cli-service` never reads that file) | Same: `sourcemap.client: true` puts 118 maps (16 MB) in `/_nuxt/`, served with the same 1-year immutable cache. Server maps stay off (they caused the trial's out-of-memory build) |

**Build memory.** Heroku builds can use about 12 GB ([Heroku limits](https://devcenter.heroku.com/articles/limits):
"Builds have a maximum memory limit of ~12 GB"). The build script raises Node's heap to 6 GB
(`NODE_OPTIONS=--max-old-space-size=6144`, which for the build replaces the app's
`NODE_OPTIONS=--openssl-legacy-provider`; Vite doesn't need that flag). With browser source maps on
and server maps off, the build peaked at 3.7 GB RSS on desk. No Modal build is needed.

**Server checked standalone.** A copy of `.output` in `/tmp` (no `node_modules` anywhere above it) served:
work page 200 with the record in the HTML, home 200, `/W2741809807` 301 to `/works/W2741809807`,
`/nope.txt` and `/_nuxt/missing.js` 404, and `/_nuxt/*.js` with `Content-Encoding: br` and
`cache-control: public, max-age=31536000, immutable`.

**Removed in this branch:** `vue.config.js`, `webpack.config.js`, `babel.config.js`, `server.js`
(the Nitro server replaces it; the parity track ported its behaviours). `npm run lint` now calls
`eslint` directly; `npm run dev` / `serve` run `nuxt dev` on port 8080 as before (8081 to 8085 still
switch API hosts: `npm run dev -- --port 8081`).

**Left for one cleanup commit after the five tracks merge** (it rewrites `package-lock.json`, which
would conflict with every track that touches dependencies):

```
npx -y npm@11 uninstall @vue/cli-plugin-babel @vue/cli-plugin-eslint @vue/cli-plugin-router \
  @vue/cli-plugin-vuex @vue/cli-service @babel/plugin-proposal-optional-chaining \
  @sentry/webpack-plugin webpack-bundle-analyzer webpack-plugin-vuetify sass-loader \
  express heroku-ssl-redirect @achrinza/node-ipc core-js @unhead/ssr unhead
npx -y npm@11 install -D @babel/preset-env   # eslint's parser config names it; it came via @vue/cli-plugin-babel
git rm vuecli-index.html                       # parity ported its boot skeleton and Zendesk setup
```

Keep `compression` (the parity track's front door uses it). Before running it, `git grep` each name
on the merged branch; then `npx vitest run`, `npm run build` and the QA harness (section 4).

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
4. **Check the origin** (bypasses Cloudflare):
   ```
   curl -s https://openalex-gui.herokuapp.com/works/W2741809807 | grep -c "The state of OA"   # >= 1
   curl -sI https://openalex-gui.herokuapp.com/W2741809807 | head -1                           # 301
   curl -sI https://openalex-gui.herokuapp.com/no-such-file.png | head -1                      # 404
   node scripts/qa/site-qa.mjs --targets live=https://openalex-gui.herokuapp.com             # whole site
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
don't count as visits or errors, and kills any browser tab that grows past 1 GB (desk's memory is
shared).

```
npm run build && PORT=5391 node .output/server/index.mjs &   # the branch, locally
npm --prefix scripts/qa install                               # playwright-core, once
source ~/.zshenv && node scripts/qa/site-qa.mjs               # prod origin vs localhost:5391
```

Output: `~/ox/oxdata/search-engines-see-record-pages/qa/<CT timestamp>/report.md`, `results.json`,
`shots/`, `compare/`.

## 5. Cloudflare (proposal only; nothing changed)

**Today** (read from the zone 2026-10-15): Business plan; no Cache Rules at all; cache level
"aggressive", browser cache TTL 4 h; tiered cache with smart topology on; no Cache Reserve; no
Worker on openalex.org. Every non-verified-bot request to openalex.org gets a managed challenge
(#876), except company pages and static files (#1486, #1294) and robots.txt (#701); verified bots
skip it. A late transform rule adds `X-OpenAlex-Verified-Assistant` to "AI Assistant" requests
(#1688). So Cloudflare caches only static file extensions today (including `/_nuxt/*.js` and `.css`
once the branch ships) and passes all HTML through.

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
