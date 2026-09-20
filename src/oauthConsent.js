// Which hosts the OAuth consent page (/oauth/consent) may send the browser back to
// (oxjob #1266). The MCP server passes its callback in `?return=`; that value comes
// from a URL anyone can craft, so only our own MCP Worker deployments are accepted.
// The consent code is useless without the Worker's shared secret, but there is no
// reason to let this page bounce anyone to an arbitrary site.
const ALLOWED_RETURN_HOSTS = [
    /^mcp\.openalex\.org$/,
    /^openalex-mcp-server(-[a-z0-9-]+)?\.our-research\.workers\.dev$/,
    /^localhost$/,
    /^127\.0\.0\.1$/,
];

export function oauthReturnUrlIsAllowed(raw) {
    if (typeof raw !== "string" || !raw || raw.length > 2048) return false;
    let u;
    try {
        u = new URL(raw);
    } catch {
        return false;
    }
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return false;
    if (u.username || u.password) return false;
    if (u.pathname !== "/oauth/callback") return false;
    return ALLOWED_RETURN_HOSTS.some((re) => re.test(u.hostname));
}
