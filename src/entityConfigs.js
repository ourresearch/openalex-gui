// color ideas!
// https://www.heavy.ai/blog/12-color-palettes-for-telling-better-stories-with-your-data
// https://carbondesignsystem.com/data-visualization/color-palettes/

import countryCodeLookup from "country-code-lookup";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";

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
            "awards.funder.id",
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
        hasSerp: false, //  Temporarily disabled - awards entity is not ready for production yet.
        rowsToShowOnEntityPage: [
            "display_name",
            "funder.id",
            "amount",
            "funding_type",
            "start_date",
            "end_date",
            "funded_outputs_count",
        ],
        groupByDefaults: [],
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
        filterName: "awards.funder",
        filterKey: "awards.funder.id",
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
        filterName: "institution type",
        filterKey: "best_oa_location.license",
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
    g: "awards", // G = awards
};

const nativeEntityTypeFromId = function (id) {
    const shortId = shortenOpenAlexId(id);

    // Match simple native IDs like "W123", "A456", "G789"
    const match = shortId.match(/^([a-z])\d+$/i);
    if (!match) {
        return;
    }

    const prefix = match[1].toLowerCase();
    return nativeIdPrefixToEntityType[prefix];
}


const externalEntityTypeFromId = function (id) {
    id = id.replaceAll("https://metadata.un.org/sdg/", "sdgs/") // hack for legacy id format:

    const shortId = shortenOpenAlexId(id)
    const regex = /^(\S+)\/\S+$/
    const wordBeforeSlash = shortId.match(regex)?.at(1)

    return getEntityConfigs()
        .filter(c => !c.isNative)
        .map(c => c.name)
        .find(entityName => {
            return entityName === wordBeforeSlash
        })
}

// test cases:
// openalex:W1234567 => { entityType: "works", name: "w1234567" }
// openalex:a1234567 => { entityType: "authors", name: "a1234567" }
// W1234567 => { entityType: "works", name: "w1234567" }
// sdgs/1 => { entityType: "sdgs", name: "1" }
// types/article => { entityType: "types", name: "article" }
// https://openalex.org/works/W1234567 => { entityType: "works", name: "w1234567" }
// https://openalex.org/types/article => { entityType: "types", name: "article" }
const parseEntityId = function (id) {
    if (!id) return
    id = id.toLowerCase()
    id = id.replaceAll("https://openalex.org/", "")
    id = id.replaceAll("openalex:", "")

    // Normalize bare IDs like "W123", "A456", "G789" to "works/W123", "authors/A456", "awards/G789"
    const bareIdMatch = id.match(/^([a-z])\d+$/i);
    if (bareIdMatch) {
        const prefix = bareIdMatch[1].toLowerCase();
        const entityTypeFromPrefix = nativeIdPrefixToEntityType[prefix];
        if (entityTypeFromPrefix) {
            id = entityTypeFromPrefix + "/" + id;
        }
    }

    const entityType = id.split("/")[0]
    const validentityTypes = getEntityConfigs().map(c => c.entityType)
    if (!validentityTypes.includes(entityType)) {
        throw new Error(`OpenAlex: parseEntityId(): id has invalid entityType: ${entityType}`)
    }

    const entityKey = id.split()
    if (!entityKey) {
        throw new Error(`OpenAlex: parseEntityId(): id has no name. id: ${id}`)
    }

    return {
        entityType,
        entityKey,
    }
}


const urlPartsFromId = function (id) {
    const shortId = shortenOpenAlexId(id)
    const entityType = entityTypeFromId(id)

    const externalEntityName = externalEntityTypeFromId(id)
    const externalEntityPath = externalEntityName + "/"
    const entityId = shortId.replace(externalEntityPath, "")

    return {
        entityType,
        entityId,
    }
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
