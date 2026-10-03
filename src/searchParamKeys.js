// The search parameters a query URL can carry (one is used at a time). Shared by url.js
// and collectionImportSource.js; its own module so the latter stays free of url.js's
// browser imports.
export const searchParamKeys = [
    'search', 'search.exact', 'search.semantic',
    'search.title', 'search.title.exact',
    'search.title_and_abstract', 'search.title_and_abstract.exact',
    'search.title_abstract_keywords', 'search.title_abstract_keywords.exact',
];
