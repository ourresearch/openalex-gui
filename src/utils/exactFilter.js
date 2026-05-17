/**
 * Wrap a value in outer double quotes for use as an exact OpenAlex filter
 * value, escaping embedded backslashes as \\ and embedded double quotes as \".
 *
 * The result is NOT URL-encoded — pass it through encodeURIComponent before
 * embedding it in a query string.
 */
export function quoteExactFilterValue(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
