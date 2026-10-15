// oxjob #1689 SSR spike: write the production-mode server HTML for a record page
// as a full document (head tags + app HTML + the inline data the client hydrates from).
// NODE_ENV=production node ssr-spike/render-prod.mjs /works/W2741809807 out.html
import fs from 'node:fs';
const [,, p, out] = process.argv;
const mod = await import('./dist-server/entry-server.mjs');
const { default: axios } = await import('axios');
const key = process.env.OPENALEX_API_KEY;
axios.interceptors.request.use((cfg) => { if (key) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${key}` }; return cfg; });
const u = mod.api.makeUrl(p.slice(1));
const seed = { [u]: await (await fetch(u, { headers: key ? { Authorization: `Bearer ${key}` } : {} })).json() };
const r = await mod.render(p, { seed });
const id = p.split('/').pop().toLowerCase();
const cache = Object.fromEntries(Object.entries(mod.apiCacheSnapshot()).filter(([k]) => k.toLowerCase().includes(id)));
const inline = JSON.stringify(cache).replace(/</g, '\\u003c');
const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
${r.headTags.headTags}
<!-- production: the client build's CSS <link> tags go here -->
</head>
<body${r.headTags.bodyAttrs}>
<div id="app">${r.html}</div>
<script>window.__API_CACHE__ = ${inline};</script>
<!-- production: the client build's JS <script> tags go here (createSSRApp + hydrate) -->
</body>
</html>
`;
fs.writeFileSync(out, doc);
console.log(`${p}: document ${doc.length} bytes = app HTML ${r.html.length} + head ${r.headTags.headTags.length} + inline data ${inline.length}`);
