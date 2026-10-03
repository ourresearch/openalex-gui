// The API gives a collection the `id` every OpenAlex entity has, a URL
// (https://openalex.org/collections/col_x), and `created_date`/`updated_date`
// (oxjob #1524). The website keys routes, `filter=collection:` values and the
// collections store by the short `col_x`, so every collection the API returns
// goes through normalizeCollection. It also reads the older shape (bare `col_x`,
// `created_at`/`updated_at`), so the site works on either side of the users-api
// deploy.

const COLLECTION_URL_PREFIX_RE = /^https?:\/\/(?:www\.)?openalex\.org\/collections\//i;

export function shortCollectionId(id) {
    return typeof id === "string" ? id.replace(COLLECTION_URL_PREFIX_RE, "") : id;
}

export function normalizeCollection(c) {
    if (!c || typeof c !== "object") return c;
    const out = { ...c, id: shortCollectionId(c.id) };
    if (out.created_date === undefined && c.created_at) out.created_date = String(c.created_at).slice(0, 10);
    if (out.updated_date === undefined && c.updated_at) out.updated_date = c.updated_at;
    delete out.created_at;
    delete out.updated_at;
    return out;
}
