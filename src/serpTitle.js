// The browser-tab title of a search page, so tabs and history entries say what
// was searched (ZD 8148, oxjob #635). App.vue's titleTemplate adds " | OpenAlex".
//
//   /q?oql=get works about (psoriasis AND biologics) -> "works about (psoriasis AND biologics)"
//   /works?search=psoriasis                         -> "psoriasis - Works search"
//   /works?filter=...                               -> "Works search"

import { capitalize } from 'lodash-es';

const MAX_LEN = 80;

const SEARCH_PARAMS = [
    'search',
    'search.exact',
    'search.semantic',
    'search.title',
    'search.title.exact',
    'search.title_and_abstract',
    'search.title_and_abstract.exact',
    'search.title_abstract_keywords',
    'search.title_abstract_keywords.exact',
];

function firstString(v) {
    return String(Array.isArray(v) ? v[0] ?? '' : v ?? '').replace(/\s+/g, ' ').trim();
}

function clip(s) {
    return s.length > MAX_LEN ? s.slice(0, MAX_LEN - 1).trimEnd() + '…' : s;
}

export function serpTitle(entityDisplayName, query = {}) {
    const base = `${capitalize(entityDisplayName)} search`;
    const oql = firstString(query.oql);
    if (oql) return clip(oql.replace(/^get\s+/i, ''));
    for (const key of SEARCH_PARAMS) {
        const text = firstString(query[key]);
        if (text) return `${clip(text)} - ${base}`;
    }
    return base;
}
