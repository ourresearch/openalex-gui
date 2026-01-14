// color ideas!
// https://www.heavy.ai/blog/12-color-palettes-for-telling-better-stories-with-your-data
// https://carbondesignsystem.com/data-visualization/color-palettes/

import countryCodeLookup from "country-code-lookup";
import * as openalexId from "@/openalexId";

const entityConfigs = {
    works: {
        icon: "mdi-file-document-outline",
        name: "works",
        entityType: "works",
        nameSingular: "work",
        displayName: "works",
        displayNameSingular: "work",
        descr: "Scholarly papers, books, datasets, etc.",
        eg: "On the Electrodynamics of Moving Bodies",
        placeholder: "Search scholarly papers, books, and more",
        filterName: "work",
        filterKey: "ids.openalex",
        hintVerb: "by",
        color: "blue",
        hasAutocomplete: true,
        isNative: true,
        hasSerp: true,
        highlightFilters: [
            {key: "open_access.is_oa", value: true, displayName: "Open Access works"},
            {key: "institutions.is_global_south", value: true, displayName: "from the Global South"},
            {key: "type", value: "dataset", displayName: "datasets"},
        ],
        rowsToShowOnEntityPage: [
            "publication_year",
            "type",
            "abstract",
            "primary_location.source.id",
            "authorships.author.id",
            "authorships.institutions.lineage",
            "language",
            null,
            "cites",
            "cited_by",
            "related_to",
            "fwci",
            "citation_normalized_percentile.value",
            null,
            "primary_topic.id",
            "primary_topic.subfield.id",
            "primary_topic.field.id",
            "primary_topic.domain.id",
            "sustainable_development_goals.id",
            null,
            "open_access.oa_status",
            "apc_paid.value_usd",
            null,
            "funders.id",
            "awards.id",
        ],
        groupByDefaults: [
            "publication_year",
            "open_access.is_oa",
            "primary_topic.id",
            "authorships.institutions.lineage",
            "type",
        ],
    },
    awards: {
        icon: "mdi-cash-multiple",
        name: "awards",
        entityType: "awards",
        nameSingular: "award",
        displayName: "awards",
        displayNameSingular: "award",
        descr: "Grants funding scholarly research",
        eg: "Fonds de recherche du Québec",
        placeholder: "Search grant awards",
        filterName: "award",
        filterKey: "awards.id",
        hintVerb: "funded by",
        color: "brown",
        hasAutocomplete: true,
        isNative: true,
        hasSerp: true, //  Temporarily disabled - awards entity is not ready for production yet.
        rowsToShowOnEntityPage: [
            "description",
            null,
            "funder.id",
            "amount",
            "funding_type",
            "funder_scheme",
            null,
            "start_date",
            "end_date",
            null,
            "investigators",
            "investigators.affiliation",
            null,
            "funded_outputs_count",
            "funder_award_id",
        ],
        groupByDefaults: [
            "start_year",
            "funder.id",
            "funding_type",
        ],
    },
    authors: {
        // icon: "mdi-account-school-outline",
        icon: "mdi-account-outline",
        name: "authors",
        entityType: "authors",
        nameSingular: "author",
        displayName: "authors",
        displayNameSingular: "author",
        descr: "Creators of scholarly works",
        eg: "Albert Einstein",
        placeholder: "Search scholarly authors",
        filterName: "author",
        filterKey: "authorships.author.id",
        hintVerb: "at",
        color: "green",
        hasAutocomplete: true,
        isNative: true,
        hasSerp: true,
        highlightFilters: [
            {key: "has_orcid", value: true, displayName: "with ORCIDs"},
            {key: "last_known_institutions.is_global_south", value: true, displayName: "from the Global South"},
        ],
        rowsToShowOnEntityPage: [
            "display_name_alternatives",
            "last_known_institutions.id",
            "affiliations.institution.id",
            "ids.orcid",
            null,
            "summary_stats.h_index",
            "summary_stats.i10_index",
        ],
        groupByDefaults: [
            "last_known_institutions.id",
            "last_known_institutions.country_code",
            "has_orcid",
        ],

    },
    sources: {
        // icon: "mdi-book-outline",
        icon: "mdi-book-open-outline",
        name: "sources",
        entityType: "sources",
        nameSingular: "source",
        displayName: "sources",
        displayNameSingular: "source",
        descr: "Journals, conferences, and repositories",
        eg: "The New England Journal of Medicine",
        placeholder: "Search academic journals & repositories",
        filterName: "primary_location.source",
        filterKey: "primary_location.source.id",
        hintVerb: "published by",
        color: "orange",
        hasAutocomplete: true,
        isNative: true,
        hasSerp: true,
        highlightFilters: [
            {key: "is_oa", value: true, displayName: "that are Open Access"},
        ],
        rowsToShowOnEntityPage: [
            "ids.issn",
            "type",
            "publisher",
            "alternate_titles",
            null,
            "is_oa",
            "is_in_doaj",
            "apc_usd",
            null,
            "summary_stats.2yr_mean_citedness",
            "summary_stats.h_index",
            "summary_stats.i10_index",
        ],
        groupByDefaults: [
            "type",
            "is_oa",
            "is_in_doaj",
        ],
    },
    publishers: {
        // icon: "mdi-book-outline",
        icon: "mdi-domain",
        name: "publishers",
        entityType: "publishers",
        nameSingular: "publisher",
        displayName: "publishers",
        displayNameSingular: "publisher",
        descr: "Company hosting journals",
        eg: "Elsevier",
        placeholder: "Search academic publishers",
        filterName: "primary_location.source.publisher_lineage",
        filterKey: "primary_location.source.publisher_lineage",
        color: "pink",
        hasAutocomplete: true,
        isNative: true,
        rowsToShowOnEntityPage: [],
    },
    funders: {
        icon: "mdi-cash-multiple",
        name: "funders",
        entityType: "funders",
        nameSingular: "funder",
        displayName: "funders",
        displayNameSingular: "funder",
        descr: "Organization that funds research",
        eg: "US National Science Foundation",
        placeholder: "Search research funders",
        filterName: "funders",
        filterKey: "funders.id",
        hintVerb: "funded by",
        color: "brown",
        hasAutocomplete: true,
        isNative: true,
        hasSerp: true,
        rowsToShowOnEntityPage: [
            "alternate_titles",
            "description",
            "homepage_url",
            null,
            "country_code",
            "ids.ror",
            "ids.wikidata",
            "ids.crossref",
            "ids.doi",
            null,
            "awards_count",
            "works_count",
            "cited_by_count",
            null,
            "summary_stats.2yr_mean_citedness",
            "summary_stats.h_index",
            "summary_stats.i10_index",
        ],
        groupByDefaults: [
            "country_code",
            "is_global_south",
        ],
    },
    institutions: {
        icon: "mdi-town-hall",
        name: "institutions",
        entityType: "institutions",
        nameSingular: "institution",
        displayName: "institutions",
        displayNameSingular: "institution",
        descr: "Universities and research centers",
        eg: "Harvard University",
        placeholder: "Search academic institutions",
        filterName: "institutions",
        filterKey: "authorships.institutions.lineage",
        hintVerb: "in",
        color: "purple",
        hasAutocomplete: true,
        isNative: true,
        hasSerp: true,
        rowsToShowOnEntityPage: [
            "display_name_alternatives",
            "parent_institutions",
            "child_institutions",
            "related_institutions",
            "ids.ror",
        ],
        groupByDefaults: [
            "country_code",
            "type",
        ],
    },
    concepts: {
        icon: "mdi-tag-outline",
        name: "concepts",
        entityType: "concepts",
        nameSingular: "concept",
        displayName: "concepts",
        displayNameSingular: "concept",
        descr: "Topics and fields of study",
        eg: "History",
        placeholder: "Search topics",
        filterName: "concepts",
        filterKey: "concepts.id",
        hasAutocomplete: true,
        isNative: true,
        rowsToShowOnEntityPage: [],
    },
    keywords: {
        icon: "mdi-tag-outline",
        name: "keywords",
        entityType: "keywords",
        nameSingular: "keyword",
        displayName: "keywords",
        displayNameSingular: "keyword",
        descr: "what works are about",
        eg: "Cardiac imaging",
        placeholder: "Search keywords",
        filterName: "keywords",
        filterKey: "keywords.id",
        hintVerb: ":",
        hasAutocomplete: true,
        isNative: false,
        rowsToShowOnEntityPage: [
        ],
    },
    topics: {
        icon: "mdi-tag-outline",
        name: "topics",
        entityType: "topics",
        nameSingular: "topic",
        displayName: "topics",
        displayNameSingular: "topics",
        descr: "what works are about",
        eg: "RNA sequencing",
        placeholder: "Search topics",
        // hasSerp: true,
        filterName: "topics",
        filterKey: "primary_topic.id",
        hintVerb: ":",
        hasAutocomplete: true,
        isNative: true,
        rowsToShowOnEntityPage: [
            "description",
            null,
            "siblings",
            "subfield",
            "field",
            "domain",
        ],
    },
    subfields: {
        icon: "mdi-tag-outline",
        name: "subfields",
        entityType: "subfields",
        nameSingular: "subfield",
        displayName: "subfields",
        displayNameSingular: "subfield",
        descr: "what works are about",
        eg: "Molecular biology",
        placeholder: "Search subfields",
        filterName: "subfields",
        filterKey: "primary_topic.subfield.id",
        hasAutocomplete: true,
        isNative: false,
        rowsToShowOnEntityPage: [
            "description",
            "display_name_alternatives",
            null,
            "topics",
            "siblings",
            "field",
            "domain",
        ],
    },
    fields: {
        icon: "mdi-tag-outline",
        name: "fields",
        entityType: "fields",
        nameSingular: "field",
        displayName: "fields",
        displayNameSingular: "field",
        descr: "what works are about",
        eg: "Computer science",
        placeholder: "Search fields",
        filterName: "fields",
        filterKey: "primary_topic.field.id",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [
            "description",
            "display_name_alternatives",
            null,
            "subfields",
            "siblings",
            "domain",
        ],
    },
    domains: {
        icon: "mdi-tag-outline",
        name: "domains",
        entityType: "domains",
        nameSingular: "domain",
        displayName: "domains",
        displayNameSingular: "domain",
        descr: "what works are about",
        eg: "Life sciences",
        placeholder: "Search domains",
        filterName: "domains",
        filterKey: "primary_topic.domain.id",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [
            "description",
            "display_name_alternatives",
            null,
            "fields",
            "siblings",
        ],
    },
    sdgs: {
        icon: "mdi-sprout-outline",
        name: "sdgs",
        entityType: "sdgs",
        nameSingular: "sdg",
        displayName: "Sustainable Development Goals",
        displayNameSingular: "Sustainable Development Goal",
        descr: "Relevant UN SDGs",
        eg: "Clean water and sanitation",
        placeholder: "Search SDGs",
        filterName: "Sustainable Development Goals",
        filterKey: "sustainable_development_goals.id",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    countries: {
        icon: "mdi-earth",
        name: "countries",
        entityType: "countries",
        nameSingular: "country",
        displayName: "countries",
        displayNameSingular: "country",
        descr: "Countries",
        eg: "Nigeria",
        placeholder: "Search countries",
        filterName: "countries",
        filterKey: "authorships.countries",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    continents: {
        icon: "mdi-earth",
        name: "continents",
        entityType: "continents",
        nameSingular: "continent",
        displayName: "continents",
        displayNameSingular: "continent",
        descr: "Continents",
        eg: "Africa",
        placeholder: "Search continents",
        filterName: "continent",
        filterKey: "authorships.institutions.continent",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [
            "countries",
        ],
    },
    languages: {
        icon: "mdi-translate",
        name: "languages",
        entityType: "languages",
        nameSingular: "language",
        displayName: "languages",
        displayNameSingular: "language",
        descr: "Languages",
        eg: "Swahili",
        placeholder: "Search languages",
        filterName: "languages",
        filterKey: "language",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    types: {
        icon: "mdi-shape-outline",
        name: "types",
        entityType: "types",
        nameSingular: "type",
        displayName: "types",
        displayNameSingular: "type",
        descr: "Work type",
        eg: "article",
        placeholder: "Search work types",
        filterName: "type",
        filterKey: "type",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [
            "description",
            "crossref_types",
        ],
    },
    "source-types": {
        icon: "mdi-shape-outline",
        name: "source-types",
        entityType: "source-types",
        nameSingular: "source type",
        displayName: "source types",
        displayNameSingular: "source type",
        descr: "Source type",
        eg: "journal",
        placeholder: "Search source types",
        filterName: "source type",
        filterKey: "primary_location.source.type",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    "institution-types": {
        icon: "mdi-shape-outline",
        name: "institution-types",
        entityType: "institution-types",
        nameSingular: "institution type",
        displayName: "institution types",
        displayNameSingular: "institution type",
        descr: "institution type",
        eg: "company",
        placeholder: "Search institution types",
        filterName: "institution type",
        filterKey: "authorships.institutions.type",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    "licenses": {
        icon: "mdi-lock-open-outline",
        name: "licenses",
        entityType: "licenses",
        nameSingular: "license",
        displayName: "licenses",
        displayNameSingular: "license",
        descr: "license of best open copy",
        eg: "CC-BY",
        placeholder: "Search licenses",
        filterName: "license",
        filterKey: "best_oa_location.license",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    "oa-statuses": {
        icon: "mdi-lock-open-outline",
        name: "oa-statuses",
        entityType: "oa-statuses",
        nameSingular: "oa status",
        displayName: "Open Access statuses",
        displayNameSingular: "Open Access status",
        descr: "Open Access status",
        eg: "gold",
        placeholder: "Search OA statuses",
        filterName: "OA status",
        filterKey: "open_access.oa_status",
        hasAutocomplete: false,
        isNative: false,
        rowsToShowOnEntityPage: [],
    },
    "locations": {
        icon: "mdi-file-document-outline",
        name: "locations",
        entityType: "locations",
        nameSingular: "location",
        displayName: "locations",
        displayNameSingular: "work location",
        descr: "Work location",
        eg: "location",
        placeholder: "Search locations",
        filterName: "location",
        filterKey: "locations.id",
        hasAutocomplete: false,
        isNative: false,
        hasSerp: false,
        rowsToShowOnEntityPage: [
            "source_id",
            "landing_page_url",
            "pdf_url",
            null,
            "is_oa",
            "version",
            "license",
            null,
            "id",
            "provenance",
        ],
    },
}


const rowsToShowOnAllEntityPagesExceptWorks = [
    "works_count",
    "cited_by_count",
]


const getEntityConfigs = function () {
    return Object.values(entityConfigs).map(c => {
        const rowsToShowOnEntityPage = c.name === "works" || c.name === "locations" ?
            c.rowsToShowOnEntityPage :
            [
                ...c.rowsToShowOnEntityPage,
                null,
                ...rowsToShowOnAllEntityPagesExceptWorks
            ]

        return {
            ...c,
            rowsToShowOnEntityPage,
        }
    })
}


const getEntityConfig = function (name) {
    if (!name) {
        console.trace();
        throw new Error("OpenAlex: getEntityConfig(): you must provide a @name argument.")
    }
    return getEntityConfigs().find(c => {
        return c.nameSingular === name || c.name === name
    })
}


// Explicit mapping from OpenAlex ID prefix to native entity "name"
// e.g. W123 → "works", A123 → "authors", G123 → "awards"
const nativeIdPrefixToEntityType = {
    w: "works",
    a: "authors",
    i: "institutions",
    s: "sources",
    p: "publishers",
    f: "funders",
    c: "concepts",
    t: "topics",
    g: "awards", // G = awards
};

/**
 * @deprecated Use openalexId.getEntityType() instead
 */
const nativeEntityTypeFromId = function (id) {
    const parsed = openalexId.parseId(id);
    if (parsed && parsed.isNative) {
        return parsed.entityType;
    }
    return undefined;
}


/**
 * @deprecated Use openalexId.getEntityType() instead
 */
const externalEntityTypeFromId = function (id) {
    const parsed = openalexId.parseId(id);
    if (parsed && !parsed.isNative) {
        return parsed.entityType;
    }
    return undefined;
}

/**
 * @deprecated Use openalexId.parseId() instead
 */
const parseEntityId = function (id) {
    const parsed = openalexId.parseId(id);
    if (!parsed) {
        throw new Error(`OpenAlex: parseEntityId(): invalid id: ${id}`);
    }
    return {
        entityType: parsed.entityType,
        entityKey: parsed.shortId,
    };
}


/**
 * @deprecated Use openalexId.parseId() instead
 */
const urlPartsFromId = function (id) {
    const parsed = openalexId.parseId(id);
    if (!parsed) {
        return { entityType: undefined, entityId: undefined };
    }
    return {
        entityType: parsed.entityType,
        entityId: parsed.shortId,
    };
}

// maybe make something that parses an id, no matter what the format, and returns the entityType and entityId

const getLocationString = function (entity) {
    if (!entity || !entity?.country_code) return
    const country = countryCodeLookup.byIso(entity?.country_code)
        ?.country
        ?.replace("United States", "USA")
        ?.replace("United Kingdom", "UK")

    const locArr = [
        entity?.geo?.city,
        entity?.geo?.region,
        country,
    ].filter(x => x)
    return locArr.join(", ")
}


export {
    entityConfigs,
    getEntityConfig,
    getEntityConfigs,
    getLocationString,
    nativeEntityTypeFromId,
    externalEntityTypeFromId,
    urlPartsFromId,
    parseEntityId,
}
