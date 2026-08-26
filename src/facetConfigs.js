import {sortByKey, uniqueObjects, unravel} from "./util";
import {getEntityConfigs} from "@/entityConfigs";
import {getPropertyDisplayName} from "@/metaCatalog";
import {collectionFilterLabel} from "@/collectionFilter";
import countryCodeLookup from "country-code-lookup";
import {continentForCountryCode} from "@/continents";

// Alternate names are alternatives *to* the display name, so the display name
// itself should never appear in the list.
const altNames = (entity, field) =>
    (entity[field] || []).filter(name => name && name !== entity.display_name);

const facetCategories = {
    works: [
        "search",
        "aboutness",
        "author",
        "source",
        "funder",
        "institution",
        "geo",
        "open access",
        "citation",
        "dates",
        "ids",
        "other",
    ],
    authors: [
        "search",
        "institution",
        "geo",
        "citation",
        "ids",
        "other",
    ],
    sources: [
        "search",
        "aboutness",
        "open access",
        "geo",
        "citation",
        "dates",
        "ids",
        "other",
    ],
    publishers: [
        "geo",
        "citation",
        "ids",
        "other",
    ],
    funders: [
        "search",
        "geo",
        "citation",
        "ids",
        "other",
    ],
    institutions: [
        "search",
        "geo",
        "citation",
        "ids",
        "other",
    ],
    concepts: [
        "citation",
        "ids",
        "other",
    ],
    locations: [
        "other",
    ],
    awards: [
        "aboutness",
        "funder",
        "investigator",
        "institution",
        "geo",
        "dates",
        "ids",
        "other",
    ],
    topics: [
        "citation",
        "ids",
        "other",
    ],
    subfields: [
        "citation",
        "other",
    ],
    fields: [
        "citation",
        "other",
    ],
    domains: [
        "citation",
        "other",
    ],
    types: [
        "citation",
        "other",
    ],
    continents: [
        "citation",
        "other",
    ],
    countries: [
        "citation",
        "other",
    ],
    languages: [
        "citation",
        "other",
    ],
    sdgs: [
        "citation",
        "other",
    ],
    "source-types": [
        "citation",
        "other",
    ],
    "institution-types": [
        "citation",
        "other",
    ],
    licenses: [
        "citation",
        "other",
    ],
    "oa-statuses": [
        "citation",
        "other",
    ],
    indexes: [
        "citation",
        "other",
    ],
    keywords: [
        "citation",
        "other",
    ],
}

const facetCategoriesIcons = {
    search: "mdi-magnify",
    author: "mdi-account-outline",
    institution: "mdi-town-hall",
    geo: "mdi-map-marker-outline",
    funder: "mdi-cash-multiple",
    source: "mdi-book-multiple-outline",
    "open access": "mdi-lock-open-outline",
    ids: "mdi-tag-outline",
    citation: "mdi-format-quote-close",
    aboutness: "mdi-lightbulb-outline",
    investigator: "mdi-account-outline",
    dates: "mdi-calendar-range",
    other: "mdi-dots-horizontal",
}


const facetConfigs = function (entityType) {
    const ret = [
        // ============================================================
        // WORKS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "works",
            entityToSelect: "works",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["column"],
            icon: "mdi-file-document-outline",
            extractFn: (entity) => entity.id,
            // As a COLUMN this is the work's own OpenAlex ID — label it "Work ID"
            // (the filter keeps "Work") and render/export the short form (W…),
            // not the canonical URL. `bare_openalex_id` strips the URL prefix
            // server-side so the CSV matches the table. See OWN_ID_COLUMN below.
            column: {
                label: "Work ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "doi",
            entityToFilter: "works",
            entityToSelect: "works",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["filter"],
            icon: "mdi-file-document-outline",
            extractFn: (entity) => entity.doi,
        },
        {
            key: "concepts.id",
            entityToFilter: "works",
            entityToSelect: "concepts",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: [],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.concepts,
        },
        {
            key: "primary_topic.id",
            entityToFilter: "works",
            entityToSelect: "topics",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by", "edit"],
            actionsPopular: ["group_by"],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic,
        },
        {
            key: "keywords.id",
            entityToFilter: "works",
            entityToSelect: "keywords",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by", "edit"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.keywords,
        },
        {
            key: "primary_topic.subfield.id",
            entityToFilter: "works",
            entityToSelect: "subfields",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic?.subfield,
        },
        {
            key: "primary_topic.field.id",
            entityToFilter: "works",
            entityToSelect: "fields",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic?.field,
        },
        {
            key: "primary_topic.domain.id",
            entityToFilter: "works",
            entityToSelect: "domains",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic?.domain,
        },
        {
            key: "awards.id",
            entityToFilter: "works",
            entityToSelect: "awards",
            type: "selectEntity",
            isManyOptions: true,
            category: "funder",
            actions: ["filter", "edit"],
            actionsPopular: [],
            icon: "mdi-cash-multiple",
            extractFn: (entity) => {
                if (!entity.awards) return [];
                return entity.awards.map(award => {
                    if (!award) return null;
                    // Extract short ID (e.g., "G5453342221" from "https://openalex.org/G5453342221")
                    const shortId = award.id?.split('/').pop() || award.id;
                    return {
                        id: award.id,
                        display_name: award.title || award.display_name || shortId
                    };
                }).filter(a => a !== null);
            },
        },
        {
            key: "funders.id",
            entityToFilter: "works",
            entityToSelect: "funders",
            type: "selectEntity",
            isManyOptions: true,
            category: "funder",
            actions: ["filter", "group_by"],
            actionsPopular: ["group_by"],
            icon: "mdi-cash-multiple",
            semanticSearchAllowed: true,
            // The client extractFn dedupes funders; the server's mechanical
            // flatten doesn't. Apply the `unique` recipe on both name + :ids
            // variants to match. Path auto-derives ("funders.display_name").
            column: { export: { recipe: "unique" } },
            extractFn: (entity) => {
                const funders = entity.funders || [];
                return uniqueObjects(funders.filter(funder => funder?.id));
            },
        },
        {
            key: "authorships.institutions.lineage",
            entityToFilter: "works",
            entityToSelect: "institutions",
            type: "selectEntity",
            isManyOptions: true,
            category: "institution",
            actions: ["filter", "group_by",],
            actionsPopular: ["filter", "group_by",],
            icon: "mdi-town-hall",
            semanticSearchAllowed: true,
            // The key is `lineage` (a filter affordance — accepts an
            // institution's ancestor IDs), but the COLUMN renders the
            // deduped per-author institutions. Server has no `lineage`
            // flat-path matching this concept; map to display_name + dedupe.
            // The :ids variant auto-derives to `authorships.institutions.id`.
            column: {
                export: {
                    path: "authorships.institutions.display_name",
                    recipe: "unique",
                },
            },
            extractFn: (entity) => {
                const nested = entity.authorships.map(authorship => {
                    return authorship.institutions
                })
                // Filter out institutions with null id (fully null objects from API)
                const filtered = nested.flat().filter(inst => inst && inst.id)
                return uniqueObjects(filtered)
            },
        },
        {
            key: "authorships.institutions.ror",
            entityToFilter: "works",
            entityToSelect: "institutions",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["filter", "column"],
            icon: "mdi-town-hall",
            // extractFn returns an array of full ROR URLs -> stringList auto-linkifies each.
            column: { render: { kind: "stringList" } },
            extractFn: (entity) => {
                const nested = entity.authorships.map(authorship => {
                    // Filter out institutions with null id before accessing ror property
                    return authorship.institutions.filter(insti => insti && insti.id).map(insti => insti.ror)
                })
                return nested.flat()
            },
        },
        {
            key: "authorships.author.id",
            entityToFilter: "works",
            entityToSelect: "authors",
            type: "selectEntity",
            isManyOptions: true,
            category: "author",
            actions: ["filter", "group_by", "edit", "column"],
            actionsPopular: ["column"],
            icon: "mdi-account-outline",
            semanticSearchAllowed: true,
            // entityList of author objects. itemLabelField/itemLinkField name the
            // snake_case API fields on each extracted item (display_name / id) —
            // NOT the camelCase `displayName` property label above.
            column: { render: { kind: "entityList", itemLabelField: "display_name", itemLinkField: "id" } },
            extractFn: (entity) => {
                return entity.authorships.map(authorship => {
                    // If we have a full author object, return it with raw_author_name attached
                    if (authorship.author) {
                        return {
                            ...authorship.author,
                            // Include raw_author_name for display on entity pages
                            raw_author_name: authorship.raw_author_name
                        };
                    }
                    // If we only have raw_author_name, create a pseudo-object
                    // This won't have an ID (so no link), but will have a display_name
                    if (authorship.raw_author_name) {
                        return {
                            display_name: authorship.raw_author_name,
                            raw_author_name: authorship.raw_author_name,
                            id: null // No ID means EntityDatumRow won't create a link
                        };
                    }
                    // No author info at all
                    return null;
                }).filter(author => author !== null); // Remove nulls
            },
        },
        {
            key: "authorships.author.orcid",
            entityToFilter: "works",
            entityToSelect: "authors",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["filter", "edit"],
            icon: "mdi-account-outline",
            extractFn: (entity) => {
                return entity.authorships.map(authorship => {
                    return authorship.author.orcid
                })
            },
        },
        // works: search
        {
            // Searches title + abstract + full-text body together (NOT
            // author/affiliation). Labeled "full text" per the Europe PMC
            // convention, where "full text" means the complete article text.
            // As of oxjob #374, fulltext.search is the canonical broad scope
            // (it used to be body-only); default.search is the deprecated alias
            // and is intentionally not surfaced as a chip here. See zd#8310.
            key: "fulltext.search",
            entityToFilter: "works",
            type: "search",
            actions: ["filter",],
            actionsPopular: [],
            category: "search",
            icon: "mdi-magnify",
        },
        {
            key: "title_and_abstract.search",
            entityToFilter: "works",
            // "title/abstract" (slash, PubMed [tiab] convention) keeps the two
            // words cohering as one scope and avoids the false-conjunction read
            // of "title and abstract". oxjob #374.
            type: "search",
            actions: ["filter",],
            actionsPopular: ["filter"],
            category: "search",
            icon: "mdi-magnify",
        },
        {
            key: "display_name.search",
            entityToFilter: "works",
            actions: ["filter",],
            actionsPopular: [],
            type: "search",
            category: "search",
            icon: "mdi-magnify",
        },
        {
            // Alias for display_name.search to support URLs like
            // /works?filter=title.search:ai . The server folded this into
            // display_name.search's alternate_keys (#446) and both render the same
            // "title" label, so it's HIDDEN from the field pickers (it would show as
            // a duplicate "title"); the facetConfig stays for URL/createFilter/export
            // parsing of legacy title.search: filters. (oxjob #505)
            key: "title.search",
            entityToFilter: "works",
            displayName: "title",
            actions: ["filter",],
            actionsPopular: [],
            type: "search",
            category: "search",
            hideFromPicker: true,
            icon: "mdi-magnify",
        },
        {
            key: "raw_affiliation_strings.search",
            entityToFilter: "works",
            type: "search",
            actions: ["filter",],
            actionsPopular: ["",],
            category: "search",
            icon: "mdi-magnify",
        },
        {
            key: "raw_affiliation_strings",
            entityToFilter: "works",
            type: "search",
            actions: ["filter",],
            actionsPopular: [],
            category: "search",
            icon: "mdi-map-marker-outline",
            verb: "is exactly",
        },
        {
            key: "doi_starts_with",
            entityToFilter: "works",
            type: "search",
            actions: ["filter",],
            actionsPopular: [],
            category: "ids",
            icon: "mdi-magnify",
            verb: "starts with",
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "works",
            type: "search",
            actions: ["sort", "column", "edit"],
            actionsPopular: ["sort", "column",],
            category: "other",
            icon: "mdi-file-document-outline",
            // The mandatory identity column. ResultsTable renders it as a link
            // to the row's own entity (passes the whole row object), so the
            // entityLink kind reads display_name + id off the work itself.
            column: { render: { kind: "entityLink" } },
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "has_abstract",
            entityToFilter: "works",
            type: "boolean",
            actions: ["filter"],
            category: "other",
            icon: "mdi-file-document-outline",
            semanticSearchAllowed: true,
        },

        // works: authors
        {
            key: "authors_count",
            entityToFilter: "works",
            type: "range",
            category: "author",
            actions: ["filter", "sort", "column",],
            icon: "mdi-account-outline",
            extractFn: (entity) => entity.authors_count,
        },
        {
            key: "corresponding_author_ids",
            entityToFilter: "works",
            entityToSelect: "authors",
            type: "selectEntity",
            isManyOptions: true,
            category: "author",
            actions: ["filter", "group_by", "edit", "column"],
            icon: "mdi-email-outline",
            // Column/export support (ZD #21941). The work JSON carries a
            // top-level `corresponding_author_ids` list of author OpenAlex URLs.
            // Like the ROR column, the extractFn returns those URLs as a
            // stringList (auto-linkified in the table); deriveExportPath sends
            // the same flat path, so the CSV ships it verbatim. Names live on
            // authorships, not this path — so this restores exactly the column
            // the old dump-all export shipped (which the new column picker
            // dropped because the config had no extractFn / column.render).
            column: { render: { kind: "stringList" } },
            extractFn: (entity) => entity.corresponding_author_ids || [],
        },
        // works: open access
        {
            key: "open_access.is_oa",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["NOT Open Access", "Open Access"],
            actions: ["filter", "column", "group_by",],
            actionsPopular: ["filter", "column", "group_by",],
            category: "open access",
            icon: "mdi-lock-open-outline",
            semanticSearchAllowed: true,
            // CellValue reads booleanValues above for the rendered labels.
            column: { render: { kind: "boolean" } },
            extractFn: (entity) => entity.open_access?.is_oa,
        },
        {
            key: "has_content.pdf",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not linked to a PDF", "linked to a PDF"],
            actions: ["filter", "column", "group_by",],
            actionsPopular: [],
            category: "open access",
            icon: "mdi-file-pdf-box",
        },
        {
            key: "best_oa_location.license",
            entityToFilter: "works",
            entityToSelect: "licenses",
            type: "selectEntity",
            // actions: [],
            actions: ["filter", "column", "group_by"],
            category: "open access",
            icon: "mdi-lock-open-outline",
            displayNullAs: "All rights reserved",
        },
        {   key: "locations.license", // Added as stub to prevent JS errors
            entityToFilter: "works",
            entityToSelect: "licenses",
            displayName: "any location license",
            type: "selectEntity",
            actions: ["filter", "edit"],
            category: "open access",
            icon: "mdi-lock-open-outline",
            displayNullAs: "All rights reserved",
        },
        {
            // works but with workarounds because entity endpoints don't exist
            key: "open_access.oa_status",
            entityToSelect: "oa-statuses",
            entityToFilter: "works",
            displayName: "Open Access status",
            type: "selectEntity",
            actions: ["filter", "column", "group_by","edit"],
            category: "open access",
            icon: "mdi-lock-open-outline",
            extractFn: (entity) => entity.open_access.oa_status,
            column: { export: { path: "open_access.oa_status" } },
        },
        {
            key: "best_oa_location.is_accepted",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["NOT Open Access", "Open Access"],
            actions: ["filter", "column", "group_by",],
            category: "open access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "best_oa_location.is_published",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["NOT Open Access", "Open Access"],
            actions: ["filter", "column", "group_by",],
            category: "open access",
            icon: "mdi-lock-open-outline",
        },
        // works: APC
        {
            key: "apc_paid.value_usd",
            entityToFilter: "works",
            type: "range",
            category: "other",
            actions: ["filter","edit","column"],
            icon: "mdi-cash",
            column: { render: { kind: "currency", currency: "USD" } },
            extractFn: (entity) => entity.apc_paid?.value_usd,
        },

        // works: primary source
        {
            key: "primary_location.source.id",
            entityToFilter: "works",
            entityToSelect: "sources",
            type: "selectEntity",
            isManyOptions: true,
            category: "source",
            actions: ["filter", "group_by",],
            icon: "mdi-book-open-outline",
            semanticSearchAllowed: true,
            extractFn: (entity) => entity.primary_location.source,
        },

        // works: source across all locations (primary + alternate)
        {
            key: "locations.source.id",
            entityToFilter: "works",
            entityToSelect: "sources",
            type: "selectEntity",
            isManyOptions: true,
            category: "source",
            actions: ["filter"],
            icon: "mdi-book-open-outline",
            // The column name says "any location" — extract the source from
            // every location, not just primary. Filter out locations whose
            // .source is null (e.g. webpages).
            extractFn: (entity) => (entity.locations ?? [])
                .map((loc) => loc.source)
                .filter((s) => s),
        },
        {
            key: "primary_location.source.issn",
            entityToFilter: "works",
            entityToSelect: "sources",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["filter"],
            icon: "mdi-book-open-outline",
            // Column-eligible (CSV export + table view): the dehydrated source
            // on works carries the issn list; server flat-path is
            // `primary_location.source.issn` (|-joined).
            extractFn: (entity) => entity.primary_location?.source?.issn,
            noIdsSibling: true,
        },
        {
            key: "primary_location.source.type",
            entityToFilter: "works",
            entityToSelect: "sources",
            type: "selectEntity",
            category: "source",
            actions: ["filter", "column", "group_by",],
            icon: "mdi-book-open-outline",
        },
        {
            key: "primary_location.source.is_in_doaj",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["Not in DOAJ", "In DOAJ"],
            category: "source",
            actions: ["filter", "group_by",],
            icon: "mdi-book-open-outline",
        },
        {
            key: "primary_location.source.is_core",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["Not CWTS Core source", "CWTS Core source"],
            category: "source",
            actions: ["filter", "group_by",],
            icon: "mdi-book-open-outline",
        },
        {
            key: "primary_location.source.is_oa",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["Not Open Access", "Open Access"],
            category: "source",
            actions: ["filter", "column", "group_by",],
            icon: "mdi-book-open-outline",
        },
        {
            // Canonical key (#455); the old alias `primary_location.source.publisher_lineage`
            // still resolves via the fold in facetConfigUtils.getFacetConfig.
            key: "primary_location.source.host_organization_lineage",
            entityToFilter: "works",
            entityToSelect: "publishers",
            type: "selectEntity",
            isManyOptions: true,
            category: "source",
            actions: ["filter", "group_by",],
            icon: "mdi-domain",
        },

        // works: institutions
        {
            key: "authorships.countries",
            entityToFilter: "works",
            entityToSelect: "countries",
            displayName: "Country",
            type: "selectEntity",
            isManyOptions: true,
            isCountry: true,
            actions: ["filter", "column", "group_by","edit"],
            actionsPopular: [],
            category: "geo",
            icon: "mdi-earth",
            // Column/export support. Without an extractFn this selectEntity
            // derives an entityList render kind but no usable extractFn, so
            // isColumnEligible() drops it — which is why "Country" was silently
            // absent from the column picker + CSV export (zd#8973). Render the
            // deduped country names in the table (countryCodeLookup, like
            // last_known_institutions.country_code); the CSV ships the raw ISO
            // codes via the authorships.countries flat path — the accepted
            // CODE_VS_NAME divergence (see parity.sweep.test.js).
            column: { render: { kind: "stringList" }, export: { path: "authorships.countries" } },
            extractFn: (entity) => {
                if (!Array.isArray(entity.authorships)) return [];
                const seen = new Set();
                const names = [];
                for (const authorship of entity.authorships) {
                    for (const code of (authorship.countries || [])) {
                        if (!code || seen.has(code)) continue;
                        seen.add(code);
                        const result = countryCodeLookup.byIso(String(code).toUpperCase());
                        names.push(result?.country || code);
                    }
                }
                return names;
            },
        },
        {
            key: "countries_distinct_count",
            entityToFilter: "works",
            type: "range",
            actions: ["filter", "sort", "column",],
            category: "geo",
            icon: "mdi-earth",
        },
        {
            key: "institutions_distinct_count",
            entityToFilter: "works",
            type: "range",
            actions: ["filter", "sort", "column",],
            category: "institution",
            icon: "mdi-earth",
        },
        {
            key: "authorships.institutions.continent",
            entityToFilter: "works",
            entityToSelect: "continents",
            displayName: "Continent",
            type: "selectEntity",
            actions: ["filter", "column", "group_by",],
            actionsPopular: [],
            category: "geo",
            icon: "mdi-earth",
            // Column/export support. Like authorships.countries (zd#8973), this
            // had "column" in actions but no extractFn, so isColumnEligible()
            // dropped it from the picker. Unlike countries, the work JSON has NO
            // continent field — institutions carry only country_code — so both
            // the table and the CSV DERIVE continent from country codes. The
            // CSV exports the existing country_code flat path through the
            // server-side `country_to_continent` recipe, which mirrors the same
            // @/continents map (see openalex-users-api/formats/csv_manifest.py).
            column: {
                render: { kind: "stringList" },
                export: { path: "authorships.institutions.country_code", recipe: "country_to_continent" },
            },
            extractFn: (entity) => {
                if (!Array.isArray(entity.authorships)) return [];
                const seen = new Set();
                const continents = [];
                for (const authorship of entity.authorships) {
                    for (const institution of (authorship.institutions || [])) {
                        const continent = continentForCountryCode(institution.country_code);
                        if (!continent || seen.has(continent)) continue;
                        seen.add(continent);
                        continents.push(continent);
                    }
                }
                return continents;
            },
        },
        {
            // Canonical key (#455); the old alias `institutions.is_global_south`
            // still resolves via the fold in facetConfigUtils.getFacetConfig.
            key: "authorships.institutions.is_global_south",
            entityToFilter: "works",
            type: "boolean",
            actions: ["filter", "column", "group_by",],
            category: "geo",
            booleanValues: ["Global North", "Global South"],
            icon: "mdi-earth",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.type",
            entityToFilter: "works",
            entityToSelect: "institution-types",
            category: "institution",
            type: "selectEntity",
            actions: ["filter", "group_by",],
            icon: "mdi-town-hall",
        },
        {
            key: "corresponding_institution_ids",
            entityToFilter: "works",
            entityToSelect: "institutions",
            category: "institution",
            type: "selectEntity",
            isManyOptions: true,
            actions: ["filter", "group_by", "column"],
            icon: "mdi-email-outline",
            // Column/export support (ZD #21941) — see corresponding_author_ids
            // above. Top-level `corresponding_institution_ids` list of
            // institution OpenAlex URLs; useful for APC analysis (which org
            // pays). stringList render + verbatim flat-path export.
            column: { render: { kind: "stringList" } },
            extractFn: (entity) => entity.corresponding_institution_ids || [],
        },

        // works: repository
        {
            key: "open_access.any_repository_has_fulltext",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["Not in any repository", "In a repository"],
            category: "source",
            actions: ["filter", "column", "group_by",],
            icon: "mdi-tag-outline",
        },

        // works: intrinsic
        {
            key: "type",
            entityToFilter: "works",
            entityToSelect: "types",
            type: "selectEntity",
            category: "other",
            actions: ["filter", "column", "group_by","edit"],
            actionsPopular: ["filter", "column", "group_by",],
            icon: "mdi-shape-outline",
            extractFn: (entity) => entity.type,
            semanticSearchAllowed: true,
            column: { export: { path: "type" } },
        },
        {
            key: "abstract",
            entityToFilter: "works",
            displayName: "Abstract",
            type: "search",
            category: "other",
            actions: ["edit", "column"],
            icon: "mdi-text",
            // Opt this search-type property in as a text column (the explicit
            // block overrides the type-based derivation, which skips `search`).
            // extractFn reconstructs the abstract from the inverted index.
            column: { render: { kind: "text" } },
            extractFn: (entity) => {
                if (!entity?.open_access?.is_oa) return
                return unravel(entity.abstract_inverted_index)
            },
        },
        {
            key: "publication_year",
            entityToFilter: "works",
            isDate: true,
            type: "range",
            category: "dates",
            actions: ["filter", "sort", "column", "group_by",],
            actionsPopular: ["filter", "sort", "column", "group_by",],
            icon: "mdi-calendar-range",
            column: { render: { kind: "year" } },
            extractFn: (entity) => entity.publication_year,
            semanticSearchAllowed: true,
        },
        {
            key: "from_created_date",
            entityToFilter: "works",
            displayName: "Created since date",
            isDate: true,
            type: "search",
            requiresApiKey: true,
            category: "dates",
            actions: ["filter", "sort", "column"],
            actionsPopular: ["sort", "column"],
            icon: "mdi-calendar-range",
            extractFn: (entity) => entity.created_date,
        },
        {
            key: "from_updated_date",
            entityToFilter: "works",
            displayName: "Updated since date",
            isDate: true,
            type: "search",
            requiresApiKey: true,
            category: "dates",
            actions: ["filter", "sort", "column"],
            actionsPopular: ["sort", "column"],
            icon: "mdi-calendar-range",
            extractFn: (entity) => entity.updated_date,
        },


        {
            key: "apc_sum",
            entityToFilter: "works",
            displayName: "APC sum",
            type: "sum",
            category: "other",
            actions: ["group_by",],
            actionsPopular: [],
            icon: "mdi-cash",
        },
        {
            key: "cited_by_count_sum",
            entityToFilter: "works",
            displayName: "Citations sum",
            type: "sum",
            category: "other",
            actions: ["group_by",],
            actionsPopular: [],
            icon: "mdi-format-quote-close",
        },
        {
            key: "publication_date",
            entityToFilter: "works",
            isDate: true,
            type: "range",
            actions: ["sort",],
            category: "dates",
            icon: "mdi-calendar-range",
        },
        {
            key: "has_doi",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["Has a DOI", "No DOI"],
            category: "ids",
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
        },
        {
            key: "indexed_in",
            entityToSelect: "indexes",
            entityToFilter: "works",
            type: "selectEntity",
            category: "ids",
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
        },
        {
            key: "mag_only",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["indexed by MAG only", "indexed beyond MAG"],
            category: "ids",
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
        },
        {
            key: "is_xpac",
            entityToFilter: "works",
            displayName: "extended index",
            type: "boolean",
            booleanValues: ["in core index", "in extended index"],
            category: "other",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-new-box",
        },
        {
            key: "has_orcid",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["No ORCID", "At least one ORCID",],
            category: "ids",
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
        },
        {
            key: "has_pmid",
            entityToFilter: "works",
            type: "boolean",
            category: "ids",
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
            booleanValues: ["No PubMed ID", "Has PubMed ID"],
        },
        {
            key: "is_retracted",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["Isn't retracted", "Is retracted"],
            category: "other",
            actions: ["filter", "column", "group_by","edit"],
            icon: "mdi-close-octagon",
            semanticSearchAllowed: true,
        },
        {
            key: "language",
            entityToSelect: "languages",
            entityToFilter: "works",
            type: "selectEntity",
            displayNullAs: "Unknown",
            category: "geo",
            actions: ["filter", "column", "group_by","edit"],
            actionsPopular: ["column"],
            icon: "mdi-translate",
            extractFn: (entity) => entity.language,
            column: { export: { path: "language" } },
        },
        {
            key: "sustainable_development_goals.id",
            entityToSelect: "sdgs",
            entityToFilter: "works",
            type: "selectEntity",
            displayNullAs: "Unknown",
            category: "aboutness",
            actions: ["filter", "group_by","edit"],
            icon: "mdi-sprout-outline",
            extractFn: (entity) => entity.sustainable_development_goals
        },
        {
            key: "cited_by_count",
            entityToFilter: "works",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column",],
            actionsPopular: ["sort", "column",],
            icon: "mdi-format-quote-close",
            column: { render: { kind: "number" } },
            extractFn: (entity) => entity.cited_by_count,
        },
        {
            key: "referenced_works_count",
            entityToFilter: "works",
            type: "range",
            category: "citation",
            actions: ["filter", "column",],
            actionsPopular: [],
            icon: "mdi-format-quote-close",
        },
        {
            key: "fwci",
            entityToFilter: "works",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column",],
            actionsPopular: ["sort", "column",],
            icon: "mdi-format-quote-close",
            extractFn: (entity) => entity.fwci,
        },
        {
            key: "cited_by",
            entityToFilter: "works",
            entityToSelect: "works",
            type: "selectEntity", // used to be "entity"
            category: "citation",
            actions: ["filter"],
            icon: "mdi-format-quote-close",
            isDisplayedAsCount: true,
            extractFn: (entity) => entity.cited_by_count,
            column: { export: { path: "cited_by_count" } },
        },
        {
            key: "cites",
            entityToFilter: "works",
            entityToSelect: "works",
            displayName: "cites",
            type: "selectEntity", // used to be "entity"
            category: "citation",
            actions: [],
            icon: "mdi-format-quote-close",
            isDisplayedAsCount: true,
            extractFn: (entity) => entity.referenced_works?.length,
            column: { export: { path: "referenced_works_count" } },
        },
        {
            key: "related_to",
            entityToFilter: "works",
            entityToSelect: "works",
            type: "selectEntity", // used to be "entity"
            category: "citation",
            actions: ["filter",],
            icon: "mdi-book-open-outline",
            isDisplayedAsCount: true,
            extractFn: (entity) => entity.related_works?.length,
            // No `related_works_count` server field; the table shows the count
            // on screen, the CSV gets the underlying ID list (richer for
            // downstream analysis — matches Jason's "raw values" call on
            // numbers / currency).
            column: { export: { path: "related_works", recipe: "bare_openalex_id" } },
        },

        // ============================================================
        // AUTHORS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "authors",
            entityToSelect: "authors",
            type: "selectEntity",
            actions: ["column"],
            actionsPopular: [],
            isId: true,
            category: "ids",
            icon: "mdi-account-outline",
            // OWN_ID_COLUMN: the author's own OpenAlex ID, rendered + exported
            // as the short form (A…). See works ids.openalex.
            extractFn: (entity) => entity.id,
            column: {
                label: "Author ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "ids.orcid",
            entityToFilter: "authors",
            entityToSelect: "authors",
            displayName: "ORCID",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["edit"],
            icon: "mdi-account-outline",
            extractFn: (e) => e.ids.orcid
        },
        {
            key: "default.search",
            entityToFilter: "authors",
            entityToSelect: "authors",
            displayName: "name",
            type: "search",
            category: "search",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-magnify",
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "authors",
            type: "search",
            actions: ["sort", "column", "edit"],
            actionsPopular: ["sort", "column",],
            category: "other",
            icon: "mdi-account-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "affiliations.institution.id",
            entityToFilter: "authors",
            displayName: "Past institutions",
            // entity-page row label only (filter UI keeps "Past institutions"): these are
            // institutions OBSERVED in the author's papers' affiliation text, not a curated CV —
            // "observed institutions" rhymes with the "Observed names" row above it and heads off
            // the most common support confusion; "past" is implied (Jason 2026-06-12)
            displayNameOnEntityPage: "observed institution",
            entityToSelect: "institutions",
            type: "selectEntity",
            isManyOptions: true,
            category: "institution",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => {
                return entity.affiliations.map(affil => {
                    return affil.institution
                })
            },
        },
        {
            key: "affiliations.institution.type",
            entityToFilter: "authors",
            entityToSelect: "institution-types",
            displayName: "Past institutions type",
            type: "selectEntity",
            category: "institution",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-shape-outline",
        },
        {
            key: "last_known_institutions.id",
            entityToFilter: "authors",
            entityToSelect: "institutions",
            type: "selectEntity",
            isManyOptions: true,
            category: "institution",
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-town-hall",
            extractFn: (entity) => entity.last_known_institutions,
        },
        {
            key: "last_known_institutions.country_code",
            entityToFilter: "authors",
            entityToSelect: "countries",
            type: "selectEntity",
            isCountry: true,
            category: "geo",
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-earth",
            extractFn: (entity) => {
                if (!entity.last_known_institutions) return null;
                return entity.last_known_institutions.map(insti => {
                    const result = countryCodeLookup.byIso(insti.country_code);
                    return result?.country || insti.country_code;
                });
            },
            column: { export: { path: "last_known_institutions.country_code" } },
        },
        {
            key: "last_known_institutions.type",
            entityToFilter: "authors",
            entityToSelect: "institution-types",
            displayName: "Institution type",
            type: "selectEntity",
            category: "institution",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-shape-outline",
        },
        {
            key: "has_orcid",
            entityToFilter: "authors",
            entityToSelect: "authors",
            type: "boolean",
            booleanValues: ["No ORCID", "Has ORCID"],
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            category: "ids",
            icon: "mdi-tag-outline",
        },
        {
            key: "display_name_alternatives",
            entityToFilter: "authors",
            entityToSelect: "authors",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => altNames(entity, "display_name_alternatives"),
            // The extracted items are plain name strings, not author objects —
            // a ":ids" sibling makes no sense here (would render an empty cell).
            noIdsSibling: true,
        },

        // authors: summary_stats
        {
            key: "summary_stats.h_index",
            entityToFilter: "authors",
            entityToSelect: "authors",
            type: "range",
            category: "citation",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats.h_index,
        },
        {
            key: "summary_stats.i10_index",
            entityToFilter: "authors",
            entityToSelect: "authors",
            type: "range",
            category: "citation",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats.i10_index,
        },
        {
            key: "summary_stats.2yr_mean_citedness",
            entityToFilter: "authors",
            entityToSelect: "authors",
            type: "range",
            category: "citation",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats?.['2yr_mean_citedness'],
        },

        // ============================================================
        // SOURCES
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "sources",
            entityToSelect: "sources",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-book-open-outline",
            actions: ["column"],
            // OWN_ID_COLUMN: the source's own OpenAlex ID (S…).
            extractFn: (entity) => entity.id,
            column: {
                label: "Source ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "default.search",
            entityToFilter: "sources",
            entityToSelect: "sources",
            displayName: "name",
            type: "search",
            category: "search",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-magnify",
        },
        {
            key: "issn",
            entityToFilter: "sources",
            type: "search",
            isId: true,
            actions: ["filter", "column"],
            actionsPopular: [],
            category: "ids",
            icon: "mdi-book-open-outline",
            extractFn: (e) => e.ids?.issn,
            // type:"search" is a filter; column.render opts it in as a column.
            // Server flat-path is `issn` (the |-joined list).
            column: { render: { kind: "stringList" }, export: { path: "issn" } },
            noIdsSibling: true,
        },
        {
            key: "issn_l",
            entityToFilter: "sources",
            type: "search",
            isId: true,
            actions: ["column"],
            category: "ids",
            icon: "mdi-book-open-outline",
            extractFn: (e) => e.issn_l,
            column: { render: { kind: "text" } },
        },
        {
            key: "country_code",
            entityToFilter: "sources",
            entityToSelect: "countries",
            displayName: "Country",
            type: "selectEntity",
            isCountry: true,
            category: "geo",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-earth",
            extractFn: (entity) => {
                if (!entity.country_code) return null;
                const r = countryCodeLookup.byIso(entity.country_code);
                return r?.country || entity.country_code;
            },
            column: { export: { path: "country_code" } },
        },
        {
            key: "first_publication_year",
            entityToFilter: "sources",
            type: "range",
            category: "dates",
            actions: ["column"],
            icon: "mdi-calendar",
            extractFn: (entity) => entity.first_publication_year,
            column: { render: { kind: "year" } },
        },
        {
            key: "homepage_url",
            entityToFilter: "sources",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-web",
            extractFn: (entity) => entity.homepage_url,
        },
        {
            key: "display_name.search",
            entityToFilter: "sources",
            displayName: "Title search",
            type: "search",
            category: "other",
            icon: "mdi-magnify",
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "sources",
            type: "search",
            actions: ["sort", "column", "edit"],
            actionsPopular: ["sort", "column",],
            category: "other",
            icon: "mdi-account-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "publisher",
            entityToFilter: "sources",
            entityToSelect: "publishers",
            displayName: "Publisher",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["edit"],
            actionsPopular: [],
            icon: "mdi-domain",
            extractFn: (e) => {
                if (e.type !== "journal") return
                return {
                    id: e.host_organization,
                    display_name: e.host_organization_name,
                }
            },
            // The "publisher" of a source is the API's `host_organization*` —
            // there's no `publisher.*` flat-path. Bare-ID variant reads
            // `host_organization` (the canonical URL; bare_openalex_id strips it).
            column: { export: { path: "host_organization_name", idsPath: "host_organization" } },
        },
        {
            key: "type",
            entityToFilter: "sources",
            entityToSelect: "source-types",
            displayName: "Source type",
            type: "selectEntity",
            category: "other",
            actions: ["filter", "edit"],
            actionsPopular: ["filter"],
            icon: "mdi-shape-outline",
            extractFn: (e) => e.type,
        },
        {
            key: "topics.id",
            entityToFilter: "sources",
            entityToSelect: "topics",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-tag-outline",
        },
        {
            key: "topics.field.id",
            entityToFilter: "sources",
            entityToSelect: "fields",
            displayName: "Field",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "topics.domain.id",
            entityToFilter: "sources",
            entityToSelect: "domains",
            displayName: "Domain",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "apc_usd",
            entityToFilter: "sources",
            displayName: "Article Processing Charge",
            type: "range",
            category: "other",
            actions: ["filter", "edit"],
            actionsPopular: [],
            icon: "mdi-cash",
            extractFn: (e) => {
                if (!e.apc_usd) return
                return "$" + e.apc_usd.toLocaleString()
            },
        },
        {
            key: "is_oa",
            entityToFilter: "sources",
            type: "boolean",
            booleanValues: ["Not Open Access", "Open Access"],
            category: "open access",
            actions: ["filter", "edit"],
            actionsPopular: ["filter"],
            icon: "mdi-lock-open-outline",
            extractFn: (e) => e.is_oa,
        },
        {
            key: "is_in_doaj",
            entityToFilter: "sources",
            type: "boolean",
            booleanValues: ["Not in DOAJ", "In DOAJ"],
            category: "open access",
            actions: ["filter", "edit"],
            actionsPopular: ["filter"],
            icon: "mdi-lock-open-outline",
            extractFn: (entity) => entity.is_in_doaj,
        },
        {
            key: "is_core",
            entityToFilter: "sources",
            type: "boolean",
            booleanValues: ["Not a CWTS Core source", "CWTS Core source"],
            category: "other",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-book-open-outline",
            extractFn: (entity) => entity.is_core,
        },
        {
            key: "alternate_titles",
            entityToFilter: "sources",
            type: "selectEntity",
            category: "other",
            actions: ["edit"],
            actionsPopular: [],
            icon: "mdi-book-open-outline",
            extractFn: (entity) => altNames(entity, "alternate_titles"),
        },

        // sources: summary_stats
        {
            key: "summary_stats.2yr_mean_citedness",
            entityToFilter: "sources",
            type: "range",
            category: "citation",
            actions: ["filter", "sort"],
            actionsPopular: ["sort"],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats["2yr_mean_citedness"],
        },
        {
            key: "summary_stats.h_index",
            entityToFilter: "sources",
            type: "range",
            category: "citation",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats.h_index,
        },
        {
            key: "summary_stats.i10_index",
            entityToFilter: "sources",
            type: "range",
            category: "citation",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats.i10_index,
        },

        // ============================================================
        // PUBLISHERS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "publishers",
            entityToSelect: "publishers",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-domain",
            actions: ["column"],
            // OWN_ID_COLUMN: the publisher's own OpenAlex ID (P…).
            extractFn: (entity) => entity.id,
            column: {
                label: "Publisher ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "display_name.search",
            entityToFilter: "publishers",
            displayName: "Name search",
            type: "search",
            category: "other",
            icon: "mdi-magnify",
        },

        // ============================================================
        // FUNDERS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "funders",
            entityToSelect: "funders",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-cash-multiple",
            actions: ["column"],
            // OWN_ID_COLUMN: the funder's own OpenAlex ID (F…).
            extractFn: (entity) => entity.id,
            column: {
                label: "Funder ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "default.search",
            entityToFilter: "funders",
            entityToSelect: "funders",
            displayName: "name",
            type: "search",
            category: "search",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-magnify",
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "funders",
            type: "search",
            actions: ["sort", "column",],
            actionsPopular: ["sort", "column",],
            category: "other",
            icon: "mdi-cash-multiple",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "ids.ror",
            entityToFilter: "funders",
            entityToSelect: "funders",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-cash-multiple",
            extractFn: (e) => e.ids?.ror,
        },
        {
            key: "ids.wikidata",
            entityToFilter: "funders",
            displayName: "Wikidata ID",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: [],
            actionsPopular: [],
            icon: "mdi-web",
            extractFn: (e) => e.ids?.wikidata,
        },
        {
            key: "ids.crossref",
            entityToFilter: "funders",
            displayName: "Crossref ID",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: [],
            actionsPopular: [],
            icon: "mdi-identifier",
            extractFn: (e) => e.ids?.crossref,
        },
        {
            key: "ids.doi",
            entityToFilter: "funders",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-identifier",
            extractFn: (e) => e.ids?.doi,
        },
        {
            key: "display_name.search",
            entityToFilter: "funders",
            displayName: "Name search",
            type: "search",
            category: "other",
            icon: "mdi-magnify",
        },
        {
            key: "country_code",
            entityToFilter: "funders",
            entityToSelect: "countries",
            displayName: "Country",
            type: "selectEntity",
            isManyOptions: true,
            isCountry: true,
            category: "geo",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-earth",
            extractFn: (entity) => entity.country_code,
        },
        {
            key: "is_global_south",
            entityToFilter: "funders",
            type: "boolean",
            actions: ["filter", "group_by"],
            actionsPopular: ["group_by"],
            category: "geo",
            booleanValues: ["Global North", "Global South"],
            icon: "mdi-earth",
            extractFn: (entity) => entity.is_global_south,
        },
        {
            key: "alternate_titles",
            entityToFilter: "funders",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-cash-multiple",
            extractFn: (entity) => altNames(entity, "alternate_titles"),
        },
        {
            key: "description",
            entityToFilter: "funders",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-text",
            extractFn: (entity) => entity.description,
        },
        {
            key: "homepage_url",
            entityToFilter: "funders",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-web",
            extractFn: (entity) => entity.homepage_url,
        },
        {
            key: "awards_count",
            entityToFilter: "funders",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: ["sort", "column"],
            icon: "mdi-cash-multiple",
            extractFn: (entity) => entity.awards_count,
        },
        // works_count / cited_by_count for funders are injected globally for
        // every entity (see worksCountFilters / citedByCountFilters below); the
        // per-entity copies that used to live here produced duplicate picker rows
        // (oxjob #621) — removed. Same trap called out in the #304 learning.
        {
            key: "summary_stats.2yr_mean_citedness",
            entityToFilter: "funders",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats?.['2yr_mean_citedness'],
        },
        {
            key: "summary_stats.h_index",
            entityToFilter: "funders",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-chart-bar",
            extractFn: (entity) => entity.summary_stats?.h_index,
        },
        {
            key: "summary_stats.i10_index",
            entityToFilter: "funders",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-chart-bar",
            extractFn: (entity) => entity.summary_stats?.i10_index,
        },

        // ============================================================
        // INSTITUTIONS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "institutions",
            entityToSelect: "institutions",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-town-hall",
            actions: ["column"],
            // OWN_ID_COLUMN: the institution's own OpenAlex ID (I…).
            extractFn: (entity) => entity.id,
            column: {
                label: "Institution ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "default.search",
            entityToFilter: "institutions",
            entityToSelect: "institutions",
            displayName: "name",
            type: "search",
            category: "search",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-magnify",
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "institutions",
            type: "search",
            actions: ["sort", "column",],
            actionsPopular: ["sort", "column",],
            category: "other",
            icon: "mdi-account-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "homepage_url",
            entityToFilter: "institutions",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-web",
            extractFn: (entity) => entity.homepage_url,
        },
        {
            key: "ids.ror",
            entityToFilter: "institutions",
            entityToSelect: "institutions",
            displayName: "ROR",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-town-hall",
            extractFn: (e) => e.ids.ror,
        },
        {
            key: "display_name.search",
            entityToFilter: "institutions",
            displayName: "Name search",
            type: "search",
            category: "other",
            icon: "mdi-magnify",
        },
        {
            key: "country_code",
            entityToFilter: "institutions",
            entityToSelect: "countries",
            displayName: "Country",
            type: "selectEntity",
            isManyOptions: true,
            isCountry: true,
            category: "geo",
            actions: ["filter"],
            actionsPopular: ["filter"],
            icon: "mdi-earth",
            // Column shows the country NAME (codebook lookup); CSV ships the raw
            // ISO code at the `country_code` flat-path (accepted CODE_VS_NAME).
            extractFn: (entity) => {
                if (!entity.country_code) return null;
                const r = countryCodeLookup.byIso(entity.country_code);
                return r?.country || entity.country_code;
            },
            column: { export: { path: "country_code" } },
        },
        {
            key: "type",
            entityToFilter: "institutions",
            entityToSelect: "institution-types",
            displayName: "Institution type",
            type: "selectEntity",
            category: "other",
            actions: ["filter", "edit"],
            actionsPopular: ["filter"],
            icon: "mdi-shape-outline",
            extractFn: (entity) => entity.type,
        },
        {
            key: "x_concepts.id",
            entityToFilter: "institutions",
            displayName: "Concepts",
            entityToSelect: "concepts",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            icon: "mdi-tag-outline",
        },
        {
            key: "display_name_alternatives",
            entityToFilter: "institutions",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => altNames(entity, "display_name_alternatives"),
            noIdsSibling: true,
        },
        {
            key: "parent_institutions",
            entityToFilter: "institutions",
            displayName: "parent institutions",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => entity.associated_institutions.filter(i => {
                return i.relationship === "parent"
            }),
            // The export service pre-splits associated_institutions by
            // relationship into virtual {rel}_institutions fields
            // (openalex-users-api formats/csv_manifest.py, ZD 23586), so the
            // CSV column carries exactly what the table shows.
            column: { export: { path: "parent_institutions.display_name", idsPath: "parent_institutions.id" } },
        },
        {
            key: "child_institutions",
            entityToFilter: "institutions",
            displayName: "child institutions",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => (entity.associated_institutions ?? []).filter(i => {
                return i.relationship === "child"
            }),
            // Relationship-true export path: the export service pre-splits
            // associated_institutions into virtual {rel}_institutions fields
            // (openalex-users-api formats/csv_manifest.py, ZD 23586). The old
            // superset path shipped parents/predecessors under this header.
            column: { export: { path: "child_institutions.display_name", idsPath: "child_institutions.id" } },
        },
        {
            key: "related_institutions",
            entityToFilter: "institutions",
            displayName: "related institutions",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => (entity.associated_institutions ?? []).filter(i => {
                return i.relationship === "related"
            }),
            // See `child_institutions` — same relationship-true export path.
            column: { export: { path: "related_institutions.display_name", idsPath: "related_institutions.id" } },
        },
        {
            key: "lineage",
            entityToFilter: "institutions",
            entityToSelect: "institutions",
            type: "selectEntity",
            // Needs a category in facetCategories.institutions or facetsByCategory
            // drops it from the picker (oxjob #621; the #304 "column-eligible yet
            // absent" trap). "other" is in that entity's list.
            category: "other",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-town-hall",
        },
        // institutions: geo (column-only — no `actions`, so absent from the
        // filter dialog but offered in the column picker; geo.city/region are
        // not OX filters). flat-paths: geo.city, geo.region.
        {
            key: "geo.city",
            entityToFilter: "institutions",
            displayName: "city",
            type: "text",
            category: "geo",
            actions: [],
            actionsPopular: [],
            icon: "mdi-map-marker-outline",
            extractFn: (entity) => entity.geo?.city,
        },
        {
            key: "geo.region",
            entityToFilter: "institutions",
            displayName: "region",
            type: "text",
            category: "geo",
            actions: [],
            actionsPopular: [],
            icon: "mdi-map-marker-outline",
            extractFn: (entity) => entity.geo?.region,
        },
        {
            key: "display_name_acronyms",
            entityToFilter: "institutions",
            type: "selectEntity",
            category: "other",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => entity.display_name_acronyms,
            // Plain strings (UM, UMich…), not entity objects.
            noIdsSibling: true,
            column: { render: { kind: "stringList" } },
        },
        // institutions: summary_stats
        {
            key: "summary_stats.2yr_mean_citedness",
            entityToFilter: "institutions",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats?.['2yr_mean_citedness'],
        },
        {
            key: "summary_stats.h_index",
            entityToFilter: "institutions",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-chart-bar",
            extractFn: (entity) => entity.summary_stats?.h_index,
        },
        {
            key: "summary_stats.i10_index",
            entityToFilter: "institutions",
            type: "range",
            category: "citation",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-chart-bar",
            extractFn: (entity) => entity.summary_stats?.i10_index,
        },

        // ============================================================
        // CONCEPTS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "concepts",
            entityToSelect: "concepts",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-tag-outline",
            actions: ["column"],
            // OWN_ID_COLUMN: the concept's own OpenAlex ID (C…).
            extractFn: (entity) => entity.id,
            column: {
                label: "Concept ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "display_name.search",
            entityToFilter: "concepts",
            displayName: "Name search",
            type: "search",
            category: "other",
            icon: "mdi-magnify",
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "concepts",
            type: "search",
            actions: ["sort", "column"],
            actionsPopular: ["sort", "column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "description",
            entityToFilter: "concepts",
            type: "search",
            category: "other",
            actions: ["column"],
            icon: "mdi-text",
            extractFn: (entity) => entity.description,
            column: { render: { kind: "text" } },
        },
        {
            key: "level",
            entityToFilter: "concepts",
            displayName: "Level",
            type: "selectEntity",
            category: "other",
            actions: ["column"],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.level,
            column: { render: { kind: "number" } },
        },

        // ============================================================
        // TOPICS
        // ============================================================
        {
            key: "ids.openalex",
            entityToFilter: "topics",
            entityToSelect: "topics",
            isId: true,
            type: "selectEntity",
            category: "ids",
            icon: "mdi-tag-outline",
            actions: ["column"],
            // OWN_ID_COLUMN: the topic's own OpenAlex ID (T…).
            extractFn: (entity) => entity.id,
            column: {
                label: "Topic ID",
                render: { kind: "stringList", bareId: true },
                export: { recipe: "bare_openalex_id" },
            },
        },
        {
            key: "description",
            entityToFilter: "topics",
            entityToSelect: "topics",
            type: "search",
            category: "other",
            actions: ["column"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
            // type:"search" stays (it's a filter); the column.render block makes
            // it ALSO a column (deriveColumnRender checks column.render first).
            column: { render: { kind: "text" } },
        },
        {
            key: "keywords",
            entityToFilter: "topics",
            type: "text",
            category: "other",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.keywords,
            noIdsSibling: true,
            column: { render: { kind: "stringList" } },
        },
        {
            key: "siblings",
            entityToFilter: "topics",
            entityToSelect: "topics",
            type: "selectEntity",
            actions: [],  // #294: no server `siblings` filter; entity-page display only
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },
        {
            key: "subfield.id",
            entityToFilter: "topics",
            entityToSelect: "topics",
            type: "selectEntity",
            actions: ["filter", "group_by"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.subfield,
        },
        {
            key: "field.id",
            entityToFilter: "topics",
            entityToSelect: "topics",
            type: "selectEntity",
            actions: ["filter", "group_by"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.field,
        },
        {
            key: "domain.id",
            entityToFilter: "topics",
            entityToSelect: "topics",
            type: "selectEntity",
            actions: ["filter", "group_by"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.domain,
        },

        // ============================================================
        // SUBFIELDS
        // ============================================================
        {
            key: "description",
            entityToFilter: "subfields",
            entityToSelect: "subfields",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityToFilter: "subfields",
            entityToSelect: "subfields",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => altNames(e, "display_name_alternatives"),
        },
        {
            key: "topics",
            entityToFilter: "subfields",
            entityToSelect: "subfields",
            type: "selectEntity",
            actions: [],  // #294: no server `topics` filter on /subfields; entity-page display only
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.topics,
        },
        {
            key: "siblings",
            entityToFilter: "subfields",
            entityToSelect: "subfields",
            type: "selectEntity",
            actions: [],  // #294: no server `siblings` filter; entity-page display only
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },
        {
            key: "field.id",
            entityToFilter: "subfields",
            entityToSelect: "subfields",
            type: "selectEntity",
            actions: ["filter", "group_by"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.field,
        },
        {
            key: "domain.id",
            entityToFilter: "subfields",
            entityToSelect: "subfields",
            type: "selectEntity",
            actions: ["filter", "group_by"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.domain,
        },

        // ============================================================
        // FIELDS
        // ============================================================
        {
            key: "description",
            entityToFilter: "fields",
            entityToSelect: "fields",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityToFilter: "fields",
            entityToSelect: "fields",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => altNames(e, "display_name_alternatives"),
        },
        {
            key: "siblings",
            entityToFilter: "fields",
            entityToSelect: "fields",
            type: "selectEntity",
            actions: [],  // #294: no server `siblings` filter; entity-page display only
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },
        {
            key: "subfields",
            entityToFilter: "fields",
            entityToSelect: "fields",
            type: "selectEntity",
            actions: [],  // #294: no server `subfields` filter on /fields; entity-page display only
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.subfields,
        },
        {
            key: "domain.id",
            entityToFilter: "fields",
            entityToSelect: "fields",
            type: "selectEntity",
            actions: ["filter", "group_by"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.domain,
        },

        // ============================================================
        // DOMAINS
        // ============================================================
        {
            key: "description",
            entityToFilter: "domains",
            entityToSelect: "domains",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityToFilter: "domains",
            entityToSelect: "domains",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => altNames(e, "display_name_alternatives"),
        },
        {
            key: "fields",
            entityToFilter: "domains",
            entityToSelect: "domains",
            type: "selectEntity",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.fields,
        },
        {
            key: "siblings",
            entityToFilter: "domains",
            entityToSelect: "domains",
            type: "selectEntity",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },

        // ============================================================
        // TYPES
        // ============================================================
        {
            key: "description",
            entityToFilter: "types",
            entityToSelect: "types",
            type: "search",
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "crossref_types",
            entityToFilter: "types",
            entityToSelect: "types",
            displayName: "crossref types",
            type: "selectEntity",
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (e) => e.crossref_types,
        },

        // ============================================================
        // CONTINENTS
        // ============================================================
        {
            key: "countries",
            entityToFilter: "continents",
            entityToSelect: "continents",
            type: "selectEntity",
            category: "other",
            icon: "mdi-earth",
            extractFn: (e) => e.countries,
        },

        // ============================================================
        // LOCATIONS
        // ============================================================
        {
            key: "work_id",
            entityToFilter: "locations",
            entityToSelect: "works",
            type: "selectEntity",
            category: "other",
            icon: "mdi-file-document-outline",
            extractFn: (e) => e.work,
        },
        {
            key: "landing_page_url",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-link",
            extractFn: (e) => e.landing_page_url,
        },
        {
            key: "pdf_url",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-file-pdf-box",
            extractFn: (e) => e.pdf_url,
        },
        {
            key: "native_id",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-identifier",
            extractFn: (e) => e.native_id,
        },
        {
            key: "native_id_namespace",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.native_id_namespace,
        },
        {
            key: "id",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-identifier",
            extractFn: (e) => e.id,
        },
        {
            key: "provenance",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-source-branch",
            extractFn: (e) => e.provenance,
        },
        {
            key: "title",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-text",
            extractFn: (e) => e.title,
        },
        {
            key: "type",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (e) => e.type,
        },
        {
            key: "source_name",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-book-open-outline",
            extractFn: (e) => e.source_name,
        },
        {
            key: "publisher",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-domain",
            extractFn: (e) => e.publisher,
        },
        {
            key: "source_id",
            entityToFilter: "locations",
            entityToSelect: "sources",
            type: "selectEntity",
            category: "other",
            icon: "mdi-book-open-outline",
            extractFn: (e) => e.source,
        },
        {
            key: "is_oa",
            entityToFilter: "locations",
            type: "boolean",
            category: "other",
            // The one location facet exposed as a builder filter (#621): the OQL
            // parser + OQO validator both accept `locations where is_oa is true`.
            // Other backend location filter fields (source_id/work_id/etc.) are
            // NOT in the OQL parser's field registry, so exposing them would break
            // the OQL round-trip — left column-only until the OQL field vocab
            // covers them.
            actions: ["filter", "column"],
            icon: "mdi-lock-open-outline",
            extractFn: (e) => e.is_oa,
        },
        {
            key: "version",
            entityToFilter: "locations",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.version,
        },
        {
            key: "license",
            entityToFilter: "locations",
            entityToSelect: "licenses",
            type: "search",
            category: "other",
            icon: "mdi-lock-open-outline",
            extractFn: (e) => e.license,
        },
        {
            key: "language",
            entityToFilter: "locations",
            entityToSelect: "languages",
            type: "search",
            category: "other",
            icon: "mdi-translate",
            extractFn: (e) => e.language,
        },

        // ============================================================
        // AWARDS
        // ============================================================
        {
            key: "primary_topic.id",
            entityToFilter: "awards",
            entityToSelect: "topics",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic,
        },
        {
            key: "primary_topic.subfield.id",
            entityToFilter: "awards",
            entityToSelect: "subfields",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic?.subfield,
        },
        {
            key: "primary_topic.field.id",
            entityToFilter: "awards",
            entityToSelect: "fields",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic?.field,
        },
        {
            key: "primary_topic.domain.id",
            entityToFilter: "awards",
            entityToSelect: "domains",
            type: "selectEntity",
            isManyOptions: true,
            category: "aboutness",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.primary_topic?.domain,
        },
        {
            key: "institution_awarded.lineage",
            entityToFilter: "awards",
            entityToSelect: "institutions",
            type: "selectEntity",
            isManyOptions: true,
            category: "institution",
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-town-hall",
            extractFn: (entity) => entity.institution_awarded,
        },
        {
            key: "institution_awarded.country_code",
            entityToFilter: "awards",
            entityToSelect: "countries",
            type: "selectEntity",
            isCountry: true,
            category: "geo",
            actions: ["filter", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-earth",
            extractFn: (entity) => entity.institution_awarded?.country_code,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "awards",
            type: "search",
            actions: [ "column"],
            actionsPopular: [ "column"],
            category: "other",
            icon: "mdi-file-document-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "amount",
            entityToFilter: "awards",
            type: "range",
            actions: ["sort", "column", "filter"],
            actionsPopular: ["sort", "column"],
            category: "other",
            icon: "mdi-cash",
            extractFn: (entity) => entity.amount,
        },
        {
            key: "funder.id",
            entityToFilter: "awards",
            entityToSelect: "funders",
            type: "selectEntity",
            isManyOptions: true,
            category: "funder",
            actions: ["filter", "column", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-cash-multiple",
            extractFn: (entity) => entity.funder,
        },
        {
            key: "funding_type",
            entityToFilter: "awards",
            type: "selectEntity",
            category: "other",
            actions: ["filter", "column", "group_by"],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.funding_type,
        },
        {
            // #294: server has no `start_date` filter (only `start_year`); was a broken
            // filter chip. Keep as display column; year filtering moved to `start_year`.
            key: "start_date",
            entityToFilter: "awards",
            type: "range",
            category: "dates",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-calendar-start",
            extractFn: (entity) => entity.start_date,
        },
        {
            // #294: server has no `end_date` filter (only `end_year`); was a broken
            // filter chip. Keep as display column; year filtering moved to `end_year`.
            key: "end_date",
            entityToFilter: "awards",
            type: "range",
            category: "dates",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-calendar-end",
            extractFn: (entity) => entity.end_date,
        },
        {
            key: "funded_outputs_count",
            entityToFilter: "awards",
            type: "range",
            category: "other",
            actions: ["filter", "sort", "column"],
            actionsPopular: ["sort", "column"],
            icon: "mdi-file-document-multiple-outline",
            extractFn: (entity) => entity.funded_outputs_count,
        },
        {
            // #294 server-supported year-range filter (RangeField start_year).
            // Single source for the awards start-year facet (oxjob #621 removed a
            // duplicate simpler copy that produced two picker rows).
            key: "start_year",
            entityToFilter: "awards",
            isDate: true,
            type: "range",
            category: "dates",
            actions: ["filter", "sort", "column", "group_by"],
            actionsPopular: ["sort", "column", "group_by"],
            icon: "mdi-calendar-start",
            extractFn: (entity) => entity.start_year,
        },
        {
            // #294 server-supported year-range filter (RangeField end_year).
            key: "end_year",
            entityToFilter: "awards",
            isDate: true,
            type: "range",
            category: "dates",
            actions: ["filter", "sort", "column"],
            actionsPopular: [],
            icon: "mdi-calendar-end",
            extractFn: (entity) => entity.end_year,
        },
        {
            key: "currency",
            entityToFilter: "awards",
            type: "selectEntity",
            category: "other",
            actions: [],
            actionsPopular: [],
            icon: "mdi-currency-usd",
        },
        {
            key: "doi",
            entityToFilter: "awards",
            type: "search",
            category: "ids",
            actions: ["filter", "column"],
            actionsPopular: [],
            icon: "mdi-identifier",
            extractFn: (entity) => entity.doi,
        },
        {
            key: "id",
            entityToFilter: "awards",
            type: "search",
            category: "ids",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-identifier",
        },
        {
            key: "funder_award_id",
            entityToFilter: "awards",
            type: "search",
            category: "ids",
            actions: ["filter", "column"],
            actionsPopular: [],
            icon: "mdi-identifier",
            extractFn: (entity) => entity.funder_award_id,
        },
        {
            key: "funder.doi",
            entityToFilter: "awards",
            type: "search",
            category: "funder",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-identifier",
        },
        {
            key: "funder.ror",
            entityToFilter: "awards",
            type: "search",
            category: "funder",
            actions: ["filter"],
            actionsPopular: [],
            icon: "mdi-identifier",
        },
        
        
        {
            key: "lead_investigator.affiliation.country",
            entityToFilter: "awards",
            entityToSelect: "countries",
            type: "selectEntity",
            isManyOptions: true,
            isCountry: true,
            category: "investigator",
            actions: [],
            actionsPopular: [],
            icon: "mdi-earth",
        },
        {
            key: "lead_investigator.affiliation.name",
            entityToFilter: "awards",
            type: "search",
            isManyOptions: true,
            category: "investigator",
            actions: [],
            actionsPopular: [],
            icon: "mdi-domain",
            extractFn: (entity) => entity.lead_investigator?.affiliation?.name,
        },
        {
            key: "investigators",
            entityToFilter: "awards",
            type: "selectEntity",
            isManyOptions: true,
            category: "investigator",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-account-outline",
            extractFn: (entity) => {
                // Combine lead_investigator, co_lead_investigator, and investigators array
                // Return plain strings (no links) since investigators aren't disambiguated
                const investigators = [];
                const addInvestigator = (inv) => {
                    const name = [inv.given_name, inv.family_name].filter(Boolean).join(' ');
                    if (name) investigators.push(name);
                };
                if (entity.lead_investigator) addInvestigator(entity.lead_investigator);
                if (entity.co_lead_investigator) addInvestigator(entity.co_lead_investigator);
                if (entity.investigators && Array.isArray(entity.investigators)) {
                    entity.investigators.forEach(addInvestigator);
                }
                return investigators;
            },
        },
        {
            key: "investigators.affiliation",
            entityToFilter: "awards",
            displayName: "institution",
            type: "selectEntity",
            isManyOptions: true,
            category: "investigator",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-town-hall",
            extractFn: (entity) => {
                // Collect all unique affiliations from all investigators
                // Return plain strings since affiliations aren't linked to institution entities
                const seen = new Set();
                const addAffiliation = (inv) => {
                    if (inv?.affiliation?.name && !seen.has(inv.affiliation.name)) {
                        seen.add(inv.affiliation.name);
                    }
                };
                if (entity.lead_investigator) addAffiliation(entity.lead_investigator);
                if (entity.co_lead_investigator) addAffiliation(entity.co_lead_investigator);
                if (entity.investigators && Array.isArray(entity.investigators)) {
                    entity.investigators.forEach(addAffiliation);
                }
                return Array.from(seen);
            },
        },
        {
            key: "provenance",
            entityToFilter: "awards",
            type: "selectEntity",
            category: "other",
            actions: ["filter", "group_by"],
            actionsPopular: [],
            icon: "mdi-source-branch",
            extractFn: (entity) => entity.provenance,
        },
        {
            key: "description",
            entityToFilter: "awards",
            type: "text",
            category: "other",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-text",
            extractFn: (entity) => entity.description,
        },
        {
            key: "landing_page_url",
            entityToFilter: "awards",
            type: "url",
            category: "ids",
            actions: ["column"],
            actionsPopular: [],
            icon: "mdi-link",
            extractFn: (entity) => entity.landing_page_url,
        },
        {
            key: "funder_scheme",
            entityToFilter: "awards",
            type: "selectEntity",
            isManyOptions: true,
            category: "funder",
            actions: ["filter", "column", "group_by"],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.funder_scheme,
        },

        // ============================================================
        // PUBLISHERS (entity page rows)
        // ============================================================
        {
            key: "alternate_titles",
            entityToFilter: "publishers",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-domain",
            extractFn: (entity) => altNames(entity, "alternate_titles"),
        },
        {
            key: "parent_publisher",
            entityToFilter: "publishers",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-domain",
            extractFn: (entity) => entity.parent_publisher,
        },
        {
            key: "country_codes",
            entityToFilter: "publishers",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-earth",
            extractFn: (entity) => {
                if (!entity.country_codes) return null;
                return entity.country_codes.map(code => {
                    const result = countryCodeLookup.byIso(code);
                    return result?.country || code;
                });
            },
        },
        {
            key: "homepage_url",
            entityToFilter: "publishers",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-web",
            extractFn: (entity) => entity.homepage_url,
        },
        {
            key: "ids.ror",
            entityToFilter: "publishers",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: [],
            icon: "mdi-domain",
            extractFn: (e) => e.ids?.ror,
        },
        {
            key: "ids.wikidata",
            entityToFilter: "publishers",
            displayName: "Wikidata ID",
            isId: true,
            type: "selectEntity",
            category: "ids",
            actions: [],
            icon: "mdi-web",
            extractFn: (e) => e.ids?.wikidata,
        },
        {
            key: "hierarchy_level",
            entityToFilter: "publishers",
            type: "range",
            category: "other",
            actions: [],
            icon: "mdi-file-tree",
            extractFn: (entity) => entity.hierarchy_level,
        },
        {
            key: "summary_stats.2yr_mean_citedness",
            entityToFilter: "publishers",
            type: "range",
            category: "citation",
            actions: ["filter"],
            icon: "mdi-chart-line",
            extractFn: (entity) => entity.summary_stats?.['2yr_mean_citedness'],
        },
        {
            key: "summary_stats.h_index",
            entityToFilter: "publishers",
            type: "range",
            category: "citation",
            actions: ["filter"],
            icon: "mdi-chart-bar",
            extractFn: (entity) => entity.summary_stats?.h_index,
        },
        {
            key: "summary_stats.i10_index",
            entityToFilter: "publishers",
            type: "range",
            category: "citation",
            actions: ["filter"],
            icon: "mdi-chart-bar",
            extractFn: (entity) => entity.summary_stats?.i10_index,
        },

        // ============================================================
        // COUNTRIES (entity page rows)
        // ============================================================
        {
            key: "description",
            entityToFilter: "countries",
            type: "search",
            category: "other",
            icon: "mdi-earth",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityToFilter: "countries",
            type: "search",
            category: "other",
            icon: "mdi-earth",
            extractFn: (e) => altNames(e, "display_name_alternatives"),
        },
        {
            key: "continent",
            entityToFilter: "countries",
            type: "selectEntity",
            actions: [],
            category: "other",
            icon: "mdi-earth",
            extractFn: (e) => e.continent,
        },
        {
            key: "is_global_south",
            entityToFilter: "countries",
            type: "boolean",
            actions: [],
            category: "other",
            icon: "mdi-earth",
            extractFn: (e) => e.is_global_south,
        },

        // ============================================================
        // SDGs (entity page rows)
        // ============================================================
        {
            key: "description",
            entityToFilter: "sdgs",
            type: "search",
            category: "other",
            icon: "mdi-sprout-outline",
            extractFn: (e) => e.description,
        },

        // ============================================================
        // SIMPLE DESCRIPTION CONFIGS (source-types, institution-types, licenses, oa-statuses)
        // ============================================================
        {
            key: "description",
            entityToFilter: "source-types",
            type: "search",
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "description",
            entityToFilter: "institution-types",
            type: "search",
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "description",
            entityToFilter: "licenses",
            type: "search",
            category: "other",
            icon: "mdi-lock-open-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "description",
            entityToFilter: "oa-statuses",
            type: "search",
            category: "other",
            icon: "mdi-lock-open-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "description",
            entityToFilter: "indexes",
            type: "search",
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },

        // ============================================================
        // DISPLAY NAME CONFIGS FOR SECONDARY ENTITY TYPES
        // (enables column view in SERP table)
        // ============================================================
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "topics",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "subfields",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "fields",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "domains",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "publishers",
            type: "search",
            actions: ["sort", "column"],
            actionsPopular: ["sort", "column"],
            category: "other",
            icon: "mdi-domain",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "types",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "continents",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-earth",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "countries",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-earth",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "languages",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-translate",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "sdgs",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-sprout-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "source-types",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "institution-types",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-shape-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "licenses",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-lock-open-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "oa-statuses",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-lock-open-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "indexes",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        {
            key: "display_name",
            isIdentityColumn: true,
            entityToFilter: "keywords",
            type: "search",
            actions: ["column"],
            category: "other",
            icon: "mdi-tag-outline",
            extractFn: (entity) => entity.display_name,
        },
        // ------------------------------------------------------------------
        // Strict GUI==OQL parity additions (oxjob #573, generated): every
        // curated OQL word is filter-faceted on every entity where it parses
        // (exclusions: date axes/bounds, self-ids, search scopes, locations —
        // see elastic-api scripts/check_curated_core_parity.py). Filter-only
        // facets: no extractFn/column config needed.
        // ------------------------------------------------------------------
        {
            key: "citation_normalized_percentile.value",
            entityToFilter: "works",
            type: "range",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "citation_normalized_percentile.is_in_top_1_percent",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not top 1% cited", "top 1% cited"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "citation_normalized_percentile.is_in_top_10_percent",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not top 10% cited", "top 10% cited"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "topics.id",
            entityToFilter: "works",
            entityToSelect: "topics",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "biblio.volume",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "biblio.issue",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "biblio.first_page",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "biblio.last_page",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "ids.mag",
            entityToFilter: "works",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "ids.pmid",
            entityToFilter: "works",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "ids.pmcid",
            entityToFilter: "works",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "referenced_works",
            entityToFilter: "works",
            entityToSelect: "works",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations_count",
            entityToFilter: "works",
            type: "range",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "has_references",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not has references", "has references"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "has_pmcid",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not has PMCID", "has PMCID"],
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "is_paratext",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not is paratext", "is paratext"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "best_open_version",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "has_fulltext",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not has fulltext", "has fulltext"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "primary_location.is_oa",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not primary OA", "primary OA"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "primary_location.is_published",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not primary published", "primary published"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "primary_location.is_accepted",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not primary accepted", "primary accepted"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "primary_location.source.has_issn",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not has ISSN", "has ISSN"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "best_oa_location.source.is_in_doaj",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not best OA source DOAJ", "best OA source DOAJ"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "is_oa",
            entityToFilter: "works",
            displayName: "is oa",
            type: "boolean",
            booleanValues: ["not is oa", "is oa"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.is_oa",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not any location OA", "any location OA"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.is_published",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not any location published", "any location published"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.is_accepted",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not any location accepted", "any location accepted"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.source.is_core",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not any location CWTS core", "any location CWTS core"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.source.is_in_doaj",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not any location DOAJ", "any location DOAJ"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "has_oa_submitted_version",
            entityToFilter: "works",
            type: "boolean",
            booleanValues: ["not has oa submitted version", "has oa submitted version"],
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "primary_location.license",
            entityToFilter: "works",
            entityToSelect: "licenses",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "best_oa_location.source.issn",
            entityToFilter: "works",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "locations.source.issn",
            entityToFilter: "works",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "primary_location.version",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.version",
            entityToFilter: "works",
            type: "search",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "best_oa_location.source.type",
            entityToFilter: "works",
            entityToSelect: "source-types",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "locations.source.type",
            entityToFilter: "works",
            entityToSelect: "source-types",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "best_oa_location.source.id",
            entityToFilter: "works",
            entityToSelect: "sources",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "topics.id",
            entityToFilter: "authors",
            entityToSelect: "topics",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "orcid",
            entityToFilter: "authors",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "topics.id",
            entityToFilter: "institutions",
            entityToSelect: "topics",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "continent",
            entityToFilter: "institutions",
            entityToSelect: "continents",
            type: "selectEntity",
            category: "geo",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-map-marker-outline",
        },
        {
            key: "host_organization",
            entityToFilter: "sources",
            entityToSelect: "publishers",
            type: "selectEntity",
            isManyOptions: true,
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "ids.mag",
            entityToFilter: "sources",
            type: "search",
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "has_issn",
            entityToFilter: "sources",
            type: "boolean",
            booleanValues: ["not has issn", "has issn"],
            category: "ids",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
        },
        {
            key: "continent",
            entityToFilter: "sources",
            entityToSelect: "continents",
            type: "selectEntity",
            category: "geo",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-map-marker-outline",
        },
        {
            key: "continent",
            entityToFilter: "publishers",
            // Normalized to selectEntity + entityToSelect:"continents" to match
            // institutions/sources (was type:"search"); consistent `type` per the
            // oxjob #621 D3 cleanup. `geo` is added to facetCategories.publishers
            // so this no longer drops out of the picker.
            entityToSelect: "continents",
            type: "selectEntity",
            category: "geo",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-map-marker-outline",
        },
        {
            key: "continent",
            entityToFilter: "funders",
            entityToSelect: "continents",
            type: "selectEntity",
            category: "geo",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-map-marker-outline",
        },
        {
            key: "summary_stats.h_index",
            entityToFilter: "concepts",
            type: "range",
            category: "citation",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-format-quote-close",
        },
        {
            key: "summary_stats.i10_index",
            entityToFilter: "concepts",
            type: "range",
            category: "citation",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-format-quote-close",
        },
        {
            key: "summary_stats.2yr_mean_citedness",
            entityToFilter: "concepts",
            type: "range",
            category: "citation",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-format-quote-close",
        },
        {
            key: "fields.id",
            entityToFilter: "domains",
            entityToSelect: "fields",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "subfields.id",
            entityToFilter: "fields",
            entityToSelect: "subfields",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "topics.id",
            entityToFilter: "subfields",
            // Normalized to selectEntity + entityToSelect:"topics" to match
            // works/authors/sources/institutions (was type:"search"); consistent
            // `type` per the oxjob #621 D3 cleanup.
            entityToSelect: "topics",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
        {
            key: "topics.id",
            entityToFilter: "awards",
            entityToSelect: "topics",
            type: "selectEntity",
            category: "other",
            actions: ["filter",],
            actionsPopular: [],
            icon: "mdi-dots-horizontal",
        },
    ]

    // #573 strict GUI==OQL parity: the former noFilterEntities withholding
    // (counts sort/column-only on the vocab entities) is gone — works_count and
    // cited_by_count are filterable on every entity that carries them.
    const worksCountFilters = getEntityConfigs()
        .map(c => c.name)
        // #294: exclude 'locations' too — /locations has no works_count/cited_by_count
        // field, so the injected filter+sort chips 400.
        .filter(name => name !== 'works' && name !== 'awards' && name !== 'locations')
        .map(name => {
            return {
                key: "works_count",
                entityToFilter: name,
                type: "range",
                category: "citation",
                actions: ["filter", "sort", "column"],
                actionsPopular: ["sort", "column",],
                icon: "mdi-file-document-multiple-outline",
                isDisplayedAsCount: true,
                extractFn: (entity) => entity.works_count,
            }
        })

    const citedByCountFilters = getEntityConfigs()
        .map(c => c.name)
        // #294: exclude 'locations' too — /locations has no works_count/cited_by_count
        // field, so the injected filter+sort chips 400.
        .filter(name => name !== 'works' && name !== 'awards' && name !== 'locations')
        .map(name => {
            return {
                key: "cited_by_count",
                entityToFilter: name,
                type: "range",
                category: "citation",
                actions: ["filter", "column", "sort"],
                actionsPopular: ["column", "sort"],
                icon: "mdi-format-quote-close",
                isDisplayedAsCount: true,
                extractFn: (entity) => entity.cited_by_count,
            }
        })

    // Inject a `collection` facet for every entity type that supports collections (v1).
    // The chip itself resolves values via /collections/<id> (see NoviceFilterChip)
    // and renders a picker that lists the current user's collections for the type.
    // facetConfigUtils.getFacetConfig also short-circuits on key === "collection"
    // for the same shape — both surfaces use this config.
    const COLLECTION_FACET_ENTITY_TYPES = [
        "works", "authors", "sources", "institutions",
        "topics", "sdgs", "funders", "publishers", "keywords", "concepts",
    ]
    const collectionFilters = COLLECTION_FACET_ENTITY_TYPES.map(name => ({
        key: "collection",
        entityToFilter: name,
        entityToSelect: "collections",
        // Human label only — the API filter key stays `collection:` (see #266/#228).
        // Per-entity "<Entity> is in collection" (oxjob #367): every collection filter
        // reads as membership of its type, and the standalone filter stops owning the
        // bare word "collection" (the #350 Zotero-overload trap). Sentence-cased, so it
        // is flagged `displayNameVerbatim` to bypass titleCase()/text-capitalize at the
        // chip + add-filter surfaces (which would wrongly yield "Work Is In Collection").
        displayName: collectionFilterLabel(name),
        displayNameVerbatim: true,
        type: "selectEntity",
        category: "other",
        actions: ["filter"],
        actionsPopular: [],
        icon: "mdi-folder-outline",
    }))

    const allConfigs = [
        ...ret,
        ...worksCountFilters,
        ...citedByCountFilters,
        ...collectionFilters,
    ]

    const manipulated = allConfigs
        // .filter(f => onlyReturnTheseFacets.includes(f.key))
        .map(config => {
            return {
                ...config,
                // Facet labels derive from the server /meta catalog (oxjob
                // #424); an authored displayName is a client override and wins
                // (used where the server label is missing, wrongly cased, or
                // deliberately different — see displayNameVerbatim entries).
                // The bare-key fallback keeps the sort below crash-safe if a
                // facet is unknown to both.
                displayName: config.displayName
                    ?? getPropertyDisplayName(config.entityToFilter, config.key)
                    ?? config.key,
            }
        })
        .filter(config => {
            return !entityType || config.entityToFilter === entityType
        })

    manipulated.sort((a, b) => {
        return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : -1
    })

    return manipulated
}


// Helper functions have been extracted to facetConfigUtils.js
// Import them from there: getFacetConfig, findFacetConfigs, facetsByCategory

export {
    facetConfigs,
    facetCategories,
    facetCategoriesIcons,
}
