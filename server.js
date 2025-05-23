const express = require('express');
const path = require('path');
const serveStatic = require('serve-static');
const sslRedirect = require('heroku-ssl-redirect');

let app = express();

// always redirect to https:
app.use(sslRedirect(['production'], 301));

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
app.use(serveStatic(__dirname + "/dist"));

app.get('*', function (req, res) {

    res.sendFile(__dirname + '/dist/index.html');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('Listening on port ' + port)
});