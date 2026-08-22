const express = require('express');
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

app.get('*', function (req, res) {
    // The SPA shell: never cache (hashed asset URLs inside it change per deploy).
    res.sendFile(path.join(dist, 'index.html'), {cacheControl: false, headers: {'Cache-Control': 'no-cache'}});
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('Listening on port ' + port)
});