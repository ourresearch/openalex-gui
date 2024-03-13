// color ideas!
// https://www.heavy.ai/blog/12-color-palettes-for-telling-better-stories-with-your-data
// https://carbondesignsystem.com/data-visualization/color-palettes/

import countryCodeLookup from "country-code-lookup";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";

const entityConfigs = {
    works: {
        icon: "mdi-file-document-outline",
        name: "works",
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
            null,
            "cites",
            "cited_by",
            "related_to",
            null,
            "primary_topic.id",
            "primary_topic.subfield.id",
            "primary_topic.field.id",
            "primary_topic.domain.id",
            "sustainable_development_goals.id",
            null,
            "open_access.oa_status",
            // null,
            "grants.funder",
            "grants.award_id",
        ],
        groupByDefaults: [
            "publication_year",
            "open_access.is_oa",
            "primary_topic.id",
            "authorships.institutions.lineage",
            "type",
        ],
    },
    authors: {
        // icon: "mdi-account-school-outline",
        icon: "mdi-account-outline",
        name: "authors",
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
        highlightFilters: [
            {key: "has_orcid", value: true, displayName: "with ORCIDs"},
            {key: "last_known_institution.is_global_south", value: true, displayName: "from the Global South"},
        ],
        rowsToShowOnEntityPage: [
            "display_name_alternatives",
            "last_known_institution.id",
            "affiliations.id",
            "ids.orcid",
            null,
            "summary_stats.h_index",
            "summary_stats.i10_index",
        ],
        groupByDefaults: [
            "last_known_institution.id",
            "last_known_institution.country_code",
            "has_orcid",
        ],

    },
    sources: {
        // icon: "mdi-book-outline",
        icon: "mdi-book-open-outline",
        name: "sources",
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
    },
    publishers: {
        // icon: "mdi-book-outline",
        icon: "mdi-domain",
        name: "publishers",
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
        // icon: "mdi-book-outline",
        icon: "mdi-cash-multiple",
        name: "funders",
        nameSingular: "funder",
        displayName: "funders",
        displayNameSingular: "funder",
        descr: "Organization funding works via grants",
        eg: "US National Science Foundation",
        placeholder: "Search research funders",
        filterName: "grants.funder",
        filterKey: "grants.funder",
        color: "brown",
        hasAutocomplete: true,
        isNative: true,
        rowsToShowOnEntityPage: [],
    },
    institutions: {
        icon: "mdi-town-hall",
        name: "institutions",
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
        rowsToShowOnEntityPage: [
            "display_name_alternatives",
            "parent_institutions",
            "child_institutions",
            "related_institutions",
            "ids.ror",
        ],
    },
    concepts: {
        icon: "mdi-tag-outline",
        name: "concepts",
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

    topics: {
        icon: "mdi-tag-outline",
        name: "topics",
        nameSingular: "topic",
        displayName: "topics",
        displayNameSingular: "topics",
        descr: "what works are about",
        eg: "RNA sequencing",
        placeholder: "Search topics",
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
        nameSingular: "subfield",
        displayName: "subfields",
        displayNameSingular: "subfield",
        descr: "what works are about",
        eg: "Molecular biology",
        placeholder: "Search subfields",
        filterName: "subfields",
        filterKey: "primary_topic.subfield.id",
        hasAutocomplete: false,
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

}


const rowsToShowOnAllEntityPagesExceptWorks = [
    "works_count",
    "cited_by_count",
]
const getEntityConfigs = function () {
    return Object.values(entityConfigs).map(c => {
        const rowsToShowOnEntityPage = c.name === "works" ?
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
    return getEntityConfigs().find(c => {
        return c.nameSingular === name || c.name === name
    })
}
const externalEntityNames = getEntityConfigs()
    .filter(c => !c.isNative)
    .map(c => c.name)

const nativeEntityFirstLetters = getEntityConfigs()
    .filter(c => c.isNative)
    .map(c => c.name.substr(0, 1))

const nativeEntityTypeFromId = function (id) {
    const shortId = shortenOpenAlexId(id)
    const regex = /^(\w)\d+$/
    const shortIdFirstLetter = shortId.match(regex)?.at(1)
    return getEntityConfigs()
        .filter(c => c.isNative)
        .map(c => c.name)
        .find(entityName => {
            const entityNameFirstLetter = entityName.substr(0, 1)
            return shortIdFirstLetter === entityNameFirstLetter
        })
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


const getLocationString = function (entity) {
    if (!entity || !entity?.country_code) return
    const countryResult = countryCodeLookup.byIso(entity?.country_code)


    const locArr = [
        entity?.geo?.city,
        entity?.geo?.region,
        countryResult?.country,
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
}