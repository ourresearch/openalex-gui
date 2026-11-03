// The in-app API viewer's helpers (oxjob #1246). Pure, for tests.
//
// The viewer fetches with the user's key in the Authorization header. "Copy URL" is the one place
// the key goes into a URL, on purpose: a script author wants a URL that works when pasted.

/** The separator a new query param goes after: '?' or '&'. */
export function keyParamJoiner(url) {
  return String(url || '').includes('?') ? '&' : '?';
}

/** The URL with `api_key=<key>` added. No key: the URL as is. Plain string edit, so the rest of the URL stays exactly as shown. */
export function keyedApiUrl(url, key) {
  if (!url || !key) return url || '';
  return `${url}${keyParamJoiner(url)}api_key=${encodeURIComponent(key)}`;
}

/**
 * What to say when the fetch failed: the HTTP status and the API's own message (the proxy's
 * 429 body is {error, message}), or the network error's text when there was no response.
 */
export function apiErrorSummary(err) {
  const resp = err?.response;
  if (!resp) {
    return { status: null, message: err?.message || 'The request failed before the API answered.' };
  }
  const body = resp.data;
  let message = '';
  if (body && typeof body === 'object') {
    message = body.message || body.error || '';
  } else if (typeof body === 'string') {
    message = body.slice(0, 500);
  }
  return { status: resp.status, message: message || resp.statusText || '' };
}
