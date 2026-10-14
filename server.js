const express = require('express');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const serveStatic = require('serve-static');
const sslRedirect = require('heroku-ssl-redirect');

let app = express();

// always redirect to https:
app.use(sslRedirect(['production'], 301));

// compress responses
app.use(compression());

// redirect alpha.openalex.org to openalex.org
app.use(function (req, res, next) {
    if (req.subdomains.includes('analytics') && req.path === '/') {
        res.redirect('https://openalex.org/analytics');
    
    } else if (req.subdomains.includes('analytics') || req.subdomains.includes('alpha')) {
        // Preserve path and params
        const path = req.path;
        const queryParams = new URLSearchParams(req.query).toString();
        const redirectUrl = `https://openalex.org${path}${queryParams ? `?${queryParams}` : ''}`;

        res.redirect(redirectUrl);
    } else {
        next();
    }
});

// Readable pages for verified AI assistants (oxjob #1688; assistantPages/index.mjs).
// ChatGPT, Claude and other assistants fetch entity and search pages for a person but
// don't run JavaScript, so the shell tells them nothing. Cloudflare sets
// X-OpenAlex-Verified-Assistant to a secret on verified "AI Assistant" requests only;
// for those, entity and list URLs get a plain page built from the API. With
// VERIFIED_ASSISTANT_TOKEN unset this does nothing, and any failure serves the site.
let assistantPage = null;
app.use(function (req, res, next) {
    const token = process.env.VERIFIED_ASSISTANT_TOKEN;
    if (!assistantPage || !token || !req.get('x-openalex-verified-assistant')) return next();
    let url;
    try {
        url = new URL('https://openalex.org' + req.originalUrl);
    } catch (err) {
        return next();
    }
    assistantPage(
        { method: req.method, url, header: (name) => req.get(name) },
        { VERIFIED_ASSISTANT_TOKEN: token, ASSISTANT_PAGES_API_KEY: process.env.ASSISTANT_PAGES_API_KEY },
    ).catch((err) => {
        console.error('Assistant page failed; serving the site instead.', err);
        return null;
    }).then((page) => {
        if (page) res.status(page.status).set(page.headers).send(page.body);
        else next();
    }).catch(next);
});

// this was helpful for configs:
// https://scotch.io/tutorials/creating-a-single-page-todo-app-with-node-and-angular
// Static assets (oxjob #860). Webpack content-hashes everything under
// js/, css/, fonts/ and img/ (a changed file gets a new URL), so those can be
// cached forever — which is also what lets Cloudflare serve them as edge HITs
// instead of revalidating with this dyno on every request (the serve-static
// default is `max-age=0`, which Cloudflare treats as stale-on-arrival).
// Everything else in dist/ (index.html, PDFs, favicons, robots.txt) keeps
// the short default so a deploy shows up immediately.
const dist = path.join(__dirname, 'dist');
for (const dir of ['js', 'css', 'fonts', 'img']) {
    app.use('/' + dir, serveStatic(path.join(dist, dir), {
        maxAge: '1y',
        immutable: true,
        index: false,
    }));
}
app.use(serveStatic(dist, {
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
    },
}));

// A missing file is a 404, not the app (oxjob #1486): otherwise /js/anything
// boots the SPA, which makes the asset prefixes a way into it. Covers the
// asset directories above plus any top-level file (/favicon.ico,
// /sitemap.xml) or brand asset: no app route is a single segment with a file
// extension. Deeper paths are left alone, since entity routes can end in one
// (DOIs, location URLs).
const MISSING_FILE = /^\/((js|css|fonts|img)\/|(brand-assets\/)?[^/]+\.\w+$)/i;

// The SPA shell, plus a copy per company page carrying its own title,
// description, canonical and Open Graph tags so bots that don't run
// JavaScript can read them (oxjob #1486; the map is src/companyPages.mjs).
// Neither is cached: the hashed asset URLs inside change per deploy.
const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
let companyPageHtml = new Map();

// The aboutness viewer (oxjob #1558): one standalone page in public/, at a clean URL.
// /aboutness has no page of its own yet, so it sends people to the viewer.
app.get('/aboutness/viewer', function (req, res) {
    res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'aboutness-viewer.html'));
});
app.get('/aboutness', function (req, res) {
    res.redirect(302, '/aboutness/viewer');
});

app.get('*', function (req, res) {
    if (MISSING_FILE.test(req.path)) {
        res.status(404).type('text/plain').send('Not found');
        return;
    }
    const pagePath = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
    res.set('Cache-Control', 'no-cache').type('html').send(companyPageHtml.get(pagePath) || shell);
});

async function loadCompanyPageHtml() {
    try {
        const { renderCompanyPageHtml } = await import('./companyPageHtml.mjs');
        companyPageHtml = await renderCompanyPageHtml(shell);
        console.log('Company page heads rendered: ' + companyPageHtml.size);
    } catch (err) {
        // Never keep the site down over this: every page falls back to the shell.
        console.error('Company page heads not rendered; serving the shell for every page.', err);
    }
}

async function loadAssistantPages() {
    try {
        ({ assistantPage } = await import('./assistantPages/index.mjs'));
    } catch (err) {
        // Never keep the site down over this: assistants get the shell, as before.
        console.error('Assistant pages not loaded; serving the site to assistants as before.', err);
    }
}

const port = process.env.PORT || 5000;
Promise.all([loadCompanyPageHtml(), loadAssistantPages()]).then(() => {
    app.listen(port, () => {
        console.log('Listening on port ' + port)
    });
});