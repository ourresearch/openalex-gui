import {sortByKey, uniqueObjects, unravel} from "./util";
import {getEntityConfigs} from "@/entityConfigs";

const facetCategories = {
    works: [
        "popular",
        "author",
        "source",
        "funder",
        "institution",
        "open access",
        "citation",
        "other",
    ],
    authors: [
        "popular",
        "institution",
        "geo",
        "ids",
        "other",
    ],
    sources: [
        "popular",
        "open access",
        "other",
    ],
    publishers: [
        "popular",
        "other",
    ],
    institutions: [
        "popular",
        "geo",
        "other",
    ],
    concepts: [
        "popular",
        "other"
    ],
}

const facetCategoriesIcons = {
    popular: "mdi-star-outline",
    author: "mdi-account-outline",
    institution: "mdi-town-hall",
    // geo: "mdi-map-marker-outline",
    // funder: "mdi-cash-multiple",
    "source": "mdi-book-multiple-outline",
    // repository: "mdi-package-variant",
    // search: "mdi-magnify",
    "open access": "mdi-lock-open-outline",
    // apc: "mdi-cash",
    ids: "mdi-tag-outline",
    citation: "mdi-format-quote-close",
    other: "mdi-dots-horizontal",
}


const facetConfigs = function (entityType) {
    const ret = [


        // works:  WASPFIC. test

        {
            key: "ids.openalex",
            entityType: "works",
            entityId: "works",
            pidPrefix: "openalex",
            displayName: "Work",
            isEntity: true,
            isSingleWork: true,
            isId: true,
            showInSidebar: true,
            noOptions: true,
            type: "select",
            categories: ["ids"],
            category: "ids",
            isList: false,
            actions: [""],
            icon: "mdi-file-document-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
            extractFn: (entity) => entity.id,
            isMultiple: false,
        },
        {
            key: "doi",
            entityType: "works",
            entityId: "works",
            displayName: "DOI",
            isEntity: true,
            isSingleWork: true,
            isId: true,
            pidPrefix: "doi",
            showInSidebar: true,
            noOptions: true,
            type: "select",
            categories: ["ids"],
            isList: false,
            category: "ids",
            actions: [],
            icon: "mdi-file-document-outline",
            regex: /(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/,
            extractFn: (entity) => entity.doi,
            isMultiple: false,
        },
        {
            key: "concepts.id",
            entityType: "works",
            displayName: "concept",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            type: "select",
            isManyOptions: true,
            categories: ["other",],
            category: "other",
            isList: false,
            actions: [],
            actionsPopular: [],
            isCore: true,
            icon: "mdi-tag-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
            extractFn: (entity) => entity.concepts,
            isMultiple: true,
        },
        {
            key: "primary_topic.id",
            entityType: "works",
            displayName: "topic",
            pidPrefix: "openalex",
            isEntity: true,
            entityId: "topics",
            type: "select",
            isManyOptions: true,
            categories: ["other",],
            category: "other",
            actions: ["filter", "group_by",],
            actionsPopular: ["filter", "group_by"],
            icon: "mdi-tag-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
            isMultiple: false,
            extractFn: (entity) => entity.primary_topic,
        },
        {
            key: "primary_topic.subfield.id",
            entityType: "works",
            displayName: "subfield",
            pidPrefix: "openalex",
            isEntity: true,
            entityId: "subfields",
            type: "select",
            isManyOptions: true,
            categories: ["other",],
            category: "other",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
            isMultiple: false,
            extractFn: (entity) => entity.primary_topic.subfield,
        },
        {
            key: "primary_topic.field.id",
            entityType: "works",
            displayName: "field",
            pidPrefix: "openalex",
            isEntity: true,
            entityId: "fields",
            type: "select",
            isManyOptions: true,
            categories: ["other",],
            category: "other",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
            isMultiple: false,
            extractFn: (entity) => entity.primary_topic.field,
        },
        {
            key: "primary_topic.domain.id",
            entityType: "works",
            displayName: "domain",
            pidPrefix: "openalex",
            isEntity: true,
            entityId: "domains",
            type: "select",
            isManyOptions: true,
            categories: ["other",],
            category: "other",
            actions: ["filter", "group_by",],
            actionsPopular: [],
            icon: "mdi-tag-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
            isMultiple: false,
            extractFn: (entity) => entity.primary_topic.domain,
        },
        {
            key: "grants.funder",
            entityType: "works",
            displayName: "funder",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "funders",
            type: "select",
            isManyOptions: true,
            categories: ["other"],
            category: "other",
            isList: true,
            actions: ["filter", "group_by",],
            isCore: true,
            icon: "mdi-cash-multiple",
            regex: /^(?:https:\/\/openalex\.org\/)?([fF]\d+)$/,
            extractFn: (entity) => entity.grants.map(grant => {
                return {
                    id: grant.funder,
                    display_name: grant.funder_display_name,
                }
            }),
            isMultiple: true,
        },
        {
            key: "grants.award_id",
            entityType: "works",
            displayName: "grant ID",
            showInSidebar: true,
            type: "select",
            isManyOptions: true,
            categories: ["funder"],
            category: "other",
            isList: true,
            actions: [],
            isCore: true,
            icon: "mdi-cash-multiple",
            extractFn: (entity) => entity.grants.map(grant => grant.award_id),
            isMultiple: true,
        },

        // {
        //     key: "authorships.institutions.id",
        //     entityType: "works",
        //     displayName: "Exact Institution",
        //     pidPrefix: "openalex",
        //     isEntity: true,
        //     showInSidebar: true,
        //     entityId: "institutions",
        //     autocompleteEndpoint: "autocomplete/institutions",
        //     type: "select",
        //     isManyOptions: true,
        //     categories: ["institution",],
        //     isCore: true,
        //     icon: "mdi-town-hall",
        //     regex: /^(?:https:\/\/openalex\.org\/)?([iI]\d+)$/,
        // },

        {
            key: "authorships.institutions.lineage",
            entityType: "works",
            displayName: "institution",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            type: "select",
            isManyOptions: true,
            categories: ["institution", "popular"],
            category: "institution",
            isList: true,
            actions: ["filter", "group_by",],
            actionsPopular: ["filter", "group_by",],
            isCore: true,
            icon: "mdi-town-hall",
            regex: /^(?:https:\/\/openalex\.org\/)?([iI]\d+)$/,
            extractFn: (entity) => {
                const nested = entity.authorships.map(authorship => {
                    return authorship.institutions
                })
                return uniqueObjects(nested.flat())
            },
            isMultiple: true,
        },

        {
            key: "authorships.institutions.ror",
            entityType: "works",
            entityId: "institutions",
            displayName: "ROR ID",
            pidPrefix: "ror",
            isEntity: true,
            isId: true,
            showInSidebar: true,
            noOptions: true,
            type: "entity",
            categories: ["ids"],
            category: "ids",
            isList: true,
            actions: [],
            icon: "mdi-town-hall",
            regex: /https?:\/\/ror\.org\/(0[a-zA-Z0-9]+)/,
            extractFn: (entity) => {
                const nested = entity.authorships.map(authorship => {
                    return authorship.institutions.map(insti => insti.ror)
                })
                return nested.flat()
            },
            isMultiple: true,
        },

        {
            key: "authorships.author.id",
            entityType: "works",
            displayName: "author",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "authors",
            autocompleteEndpoint: "autocomplete/authors",
            type: "select",
            isManyOptions: true,
            categories: ["author", "popular"],
            category: "author",
            isList: true,
            actions: ["filter", "group_by",],
            actionsPopular: ["filter", "group_by",],
            isCore: true,
            icon: "mdi-account-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([aA]\d+)$/,
            extractFn: (entity) => {
                return entity.authorships.map(authorship => {
                    return authorship.author
                })
            },
            isMultiple: true,
        },


        {
            key: "authorships.author.orcid",
            entityType: "works",
            entityId: "authors",
            displayName: "ORCID",
            pidPrefix: "orcid",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["ids"],
            category: "ids",
            isList: true,
            actions: [],
            icon: "mdi-account-outline",
            regex: /https?:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/,
            extractFn: (entity) => {
                return entity.authorships.map(authorship => {
                    return authorship.author.orcid
                })
            },
            isMultiple: true,
        },


        // works: search

        {
            key: "default.search",
            entityType: "works",
            displayName: "fulltext",
            type: "search",
            categories: ["other", "popular"],
            actions: ["filter",],
            actionsPopular: ["filter",],
            category: "other",
            isList: false,
            isCore: true,
            icon: "mdi-magnify",
            isMultiple: false,
        },
        {
            key: "title_and_abstract.search",
            entityType: "works",
            displayName: "title & abstract",
            type: "search",
            categories: ["other",],
            actions: ["filter",],
            actionsPopular: ["",],
            category: "other",
            isList: false,
            isCore: true,
            icon: "mdi-magnify",
            isMultiple: false,
        },
        // {
        //     key: "display_name.search",
        //     isDefault: true,
        //     entityType: "works",
        //     displayName: "Title",
        //     type: "search",
        //     categories: ["search"],
        //     isCore: true,
        //     icon: "mdi-magnify",
        // },
        // {
        //     key: "abstract.search",
        //     entityType: "works",
        //     displayName: "Abstract search",
        //     type: "search",
        //     categories: ["search"],
        //     isCore: true,
        //     icon: "mdi-magnify",
        // },

        /// this is a wierd one, still working it into the schema
        {
            key: "display_name",
            isColumnMandatory: true,
            isDefault: true,
            entityType: "works",
            displayName: "title",
            type: "search",
            categories: ["search"],
            actions: ["sort", "column",],
            actionsPopular: ["sort", "column",],
            category: "other",
            isList: false,
            isCore: true,
            icon: "mdi-file-document-outline",
            extractFn: (entity) => entity.display_name,
            isMultiple: false,
        },

        // {
        //     key: "has_abstract",
        //     entityType: "works",
        //     displayName: "Indexing status (abstract)",
        //     booleanValues: ["Abstract NOT indexed", "Abstract indexed"],
        //     type: "boolean",
        //     categories: ["search"],
        //     icon: "mdi-file-document-outline",
        // },
        // {
        //     key: "has_ngrams",
        //     entityType: "works",
        //     displayName: "Indexing status (fulltext)",
        //     booleanValues: ["fulltext NOT indexed", "fulltext indexed"],
        //     type: "boolean",
        //     categories: ["search"],
        //     icon: "mdi-file-document-outline",
        // },


        // works: authors

        {
            key: "authors_count",
            entityType: "works",
            displayName: "authors count",
            type: "range",
            sortByValue: true,
            placeholders: ["min", "max"],
            categories: ["author"],
            category: "author",
            isList: false,
            actions: ["filter", "sort", "column",],
            icon: "mdi-account-outline",
            extractFn: (entity) => entity.authors_count,
            isMultiple: false,
        },
        {
            key: "corresponding_author_ids",
            entityType: "works",
            entityId: "authors",
            displayName: "corresponding author",
            type: "select",
            isManyOptions: true,
            categories: ["author"],
            category: "author",
            isList: true,
            actions: ["filter", "group_by",],
            icon: "mdi-email-outline",
            isMultiple: true,
        },


        // works: open access
        {
            key: "open_access.is_oa",
            entityType: "works",
            displayName: "open access",
            type: "boolean",
            booleanValues: ["NOT Open Access", "Open Access"],
            categories: ["popular", "open access"],
            actions: ["filter", "column", "group_by",],
            actionsPopular: ["filter", "column", "group_by",],
            category: "open access",
            isList: false,
            isCore: true,
            icon: "mdi-lock-open-outline",
            isMultiple: false,
        },
        {
            key: "best_oa_location.license",
            entityType: "works",
            displayName: "license",
            type: "select",
            categories: ["open access"],
            actions: ["filter", "column", "group_by",],
            category: "open access",
            isList: false,
            icon: "mdi-lock-open-outline",
            displayNullAs: "All rights reserved",
            isMultiple: false,
        },
        {
            key: "open_access.oa_status",
            entityType: "works",
            displayName: "Open Access status",
            type: "select",
            categories: ["open access"],
            actions: ["filter", "column", "group_by",],
            category: "open access",
            isList: false,
            icon: "mdi-lock-open-outline",
            isMultiple: false,
            extractFn: (entity) => entity.open_access.oa_status,
        },
        // {
        //     key: "best_oa_location.version",
        //     entityType: "works",
        //     displayName: "Open Access version",
        //     type: "select",
        //     categories: ["open access"],
        //     icon: "mdi-lock-open-outline",
        // },
        {
            key: "best_oa_location.is_accepted",
            entityType: "works",
            displayName: "open access accepted",
            type: "boolean",
            booleanValues: ["NOT Open Access", "Open Access"],
            categories: ["open access"],
            actions: ["filter", "column", "group_by",],
            category: "open access",
            isList: false,
            isCore: true,
            icon: "mdi-lock-open-outline",
            isMultiple: false,
        },
        {
            key: "best_oa_location.is_published",
            entityType: "works",
            displayName: "open access published",
            type: "boolean",
            booleanValues: ["NOT Open Access", "Open Access"],
            categories: ["open access"],
            actions: ["filter", "column", "group_by",],
            category: "open access",
            isList: false,
            isCore: true,
            icon: "mdi-lock-open-outline",
            isMultiple: false,
        },


        // works: APC
        // {
        //     key: "apc_list.value_usd",
        //     entityType: "works",
        //     displayName: "APC list price",
        //     type: "range",
        //     sortByValue: true,
        //     placeholders: ["min", "max"],
        //     categories: ["apc"],
        //     isCore: true,
        //     icon: "mdi-cash"
        // },


        //
        // {
        //     key: "apc_paid.value_usd",
        //     entityType: "works",
        //     displayName: "APC paid",
        //     type: "range",
        //     sortByValue: true,
        //     placeholders: ["min", "max"],
        //     categories: ["apc"],
        //     actions: ["filter", ],
        //     isCore: true,
        //     icon: "mdi-cash"
        // },


        // {
        //     key: "apc_paid.provenance",
        //     entityType: "works",
        //     displayName: "APC paid: provenance",
        //     type: "select",
        //     categories: ["apc"],
        //     isCore: true,
        //     icon: "mdi-cash"
        // },


        // works: institutions:
        {
            key: "authorships.countries",
            entityType: "works",
            entityId: "countries",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            type: "select",
            isManyOptions: true,
            isCountry: true,
            categories: ["geo", "institution"],
            actions: ["filter", "column", "group_by",],
            actionsPopular: ["group_by",],
            category: "institution",
            isList: true,
            isCore: true,
            icon: "mdi-map-marker-outline",
            isMultiple: true,
        },
        {
            key: "countries_distinct_count",
            entityType: "works",
            displayName: "countries count",
            type: "range",
            sortByValue: true,
            examples: ["1", "2-", "2-10"],
            categories: ["geo"],
            actions: ["filter", "sort", "column",],
            category: "institution",
            isList: false,
            icon: "mdi-map-marker-outline",
            isMultiple: false,
        },
        // {
        //     key: "institutions.continent",
        //     entityType: "works",
        //     displayName: "Continent",
        //     type: "select",
        //     categories: ["geo", "institution"],
        //     isCore: true,
        //     icon: "mdi-map-marker-outline",
        // },
        {
            key: "institutions.is_global_south",
            entityType: "works",
            displayName: "from Global South",
            type: "boolean",
            actions: ["filter", "column", "group_by",],
            categories: ["geo", "institution"],
            category: "institution",
            isList: false,
            booleanValues: ["Global North", "Global South"],
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
            isMultiple: true,
        },
        {
            key: "authorships.institutions.type",
            entityType: "works",
            displayName: "institution type",
            category: "institution",
            isList: true,
            autocompleteEndpoint: "autocomplete/institutions/country",
            type: "select",
            categories: ["institution"],
            actions: ["filter", "group_by",],
            icon: "mdi-town-hall",
            isMultiple: true,
        },
        {
            key: "corresponding_institution_ids",
            entityType: "works",
            entityId: "institutions",
            displayName: "corresponding institution",
            category: "institution",
            isList: true,
            type: "select",
            isManyOptions: true,
            categories: ["institution"],
            actions: ["filter", "group_by",],
            icon: "mdi-email-outline",
            isMultiple: true,
        },


        // works: primary source

        {
            key: "primary_location.source.id",
            entityType: "works",
            displayName: "source",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "sources",
            autocompleteEndpoint: "autocomplete/sources",
            type: "select",
            isManyOptions: true,
            categories: ["source"],
            category: "source",
            isList: false,
            actions: ["filter", "group_by",],
            isCore: true,
            icon: "mdi-book-open-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([sS]\d+)$/,
            extractFn: (entity) => entity.primary_location.source,
            isMultiple: false,
        },

        {
            key: "primary_location.source.issn",
            entityType: "works",
            entityId: "sources",
            displayName: "ISSN",
            isEntity: true,
            isId: true,
            pidPrefix: "issn",
            showInSidebar: true,
            noOptions: true,
            type: "entity",
            categories: ["ids"],
            category: "ids",
            isList: false,
            actions: [],
            icon: "mdi-book-open-outline",
            regex: /^(\b\d{4}-\d{3}[\dX]\b)$/,
            isMultiple: false,
        },
        {
            key: "primary_location.source.type",
            entityType: "works",
            displayName: "source type",
            type: "select",
            categories: ["source"],
            category: "source",
            isList: false,
            actions: ["filter", "column", "group_by",],
            icon: "mdi-book-open-outline",
            isMultiple: false,
        },
        {
            key: "primary_location.source.is_in_doaj",
            entityType: "works",
            displayName: "indexed by DOAJ",
            type: "boolean",
            booleanValues: ["Not in DOAJ", "In DOAJ"],
            categories: ["source"],
            category: "source",
            isList: false,
            actions: ["filter", "group_by",],
            icon: "mdi-book-open-outline",
            isMultiple: false,
        },
        {
            key: "primary_location.source.is_oa",
            entityType: "works",
            displayName: "in OA source",
            type: "boolean",
            booleanValues: ["Not Open Access", "Open Access"],
            categories: ["source"],
            category: "source",
            isList: false,
            actions: ["filter", "column", "group_by",],
            icon: "mdi-book-open-outline",
            isMultiple: false,
        },

        {
            key: "primary_location.source.publisher_lineage",
            entityType: "works",
            entityId: "publishers",
            displayName: "publisher",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            // entityId: "publishers",
            autocompleteEndpoint: "autocomplete/publishers",
            type: "select",
            isManyOptions: true,
            categories: ["source"],
            category: "source",
            isList: false,
            actions: ["filter", "group_by",],
            isCore: true,
            icon: "mdi-domain",
            regex: /^(?:https:\/\/openalex\.org\/)?([pP]\d+)$/,
            isMultiple: false,
        },


        // works: repository

        {
            key: "repository",
            entityType: "works",
            displayName: "repository",
            isEntity: true,
            showInSidebar: true,
            entityId: "sources",
            type: "select",
            isManyOptions: true,
            categories: ["source"],
            category: "source",
            isList: true,
            actions: ["filter", "group_by",],
            isCore: true,
            icon: "mdi-book-open-outline",
            isMultiple: true,
        },
        {
            key: "open_access.any_repository_has_fulltext",
            entityType: "works",
            displayName: "has repository fulltext",
            type: "boolean",
            booleanValues: ["Not in any repository", "In a repository"],
            categories: ["source"],
            category: "source",
            isList: false,
            actions: ["filter", "column", "group_by",],
            icon: "mdi-tag-outline",
            isMultiple: true,
        },


        // works: intrinsic

        {
            key: "type",
            entityType: "works",
            entityId: "types",
            displayName: "type",
            type: "select",
            categories: ["popular", "other"],
            category: "other",
            isList: false,
            actions: ["filter", "column", "group_by",],
            actionsPopular: ["filter", "column", "group_by",],
            icon: "mdi-shape-outline",
            extractFn: (entity) => entity.type,
            isMultiple: false,
        },
        {
            key: "abstract",
            entityType: "works",
            displayName: "Abstract",
            type: "search",
            categories: ["search"],
            actions: [], // just for display
            isCore: true,
            icon: "mdi-text",
            isMultiple: false,
            extractFn: (entity) => {
                if (!entity?.open_access?.is_oa) return
                return unravel(entity.abstract_inverted_index)
            },
        },
        {
            key: "publication_year",
            entityType: "works",
            displayName: "year",
            isDate: true,
            type: "range",
            sortByValue: true,
            examples: ["1999", "1999-", "1999-2020"],
            categories: ["popular", "other"],
            category: "other",
            isList: false,
            actions: ["filter", "sort", "column", "group_by",],
            actionsPopular: ["filter", "sort", "column", "group_by",],
            isCore: true,
            icon: "mdi-calendar-range",
            extractFn: (entity) => entity.publication_year,
            isMultiple: false,
        },
        {
            key: "publication_date",
            entityType: "works",
            displayName: "date",
            isDate: true,
            type: "range",
            categories: ["other"],
            actions: ["sort",],
            sortByValue: true,
            category: "other",
            isList: false,
            examples: ["1999", "1999-", "1999-2020"],
            isCore: true,
            icon: "mdi-calendar-range",
            isMultiple: false,
        },
        {
            key: "has_doi",
            entityType: "works",
            displayName: "indexed by Crossref",
            type: "boolean",
            booleanValues: ["Has a DOI", "No DOI"],
            categories: ["ids"],
            category: "ids",
            isList: false,
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
            isMultiple: false,
        },
        {
            key: "has_orcid",
            entityType: "works",
            displayName: "indexed by ORCID",
            type: "boolean",
            booleanValues: ["No ORCID", "At least one ORCID",],
            categories: ["ids"],
            isList: false,
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
            isMultiple: true,
        },
        {
            key: "has_pmid",
            entityType: "works",
            displayName: "indexed by PubMed",
            type: "boolean",
            categories: ["ids"],
            category: "ids",
            isList: false,
            actions: ["filter", "group_by",],
            icon: "mdi-tag-outline",
            booleanValues: ["No PubMed ID", "Has PubMed ID"],
            isMultiple: false,
        },
        // {
        //     key: "has_pmcid",
        //     entityType: "works",
        //     displayName: "Indexed by PubMed Central",
        //     type: "boolean",
        //     categories: ["ids"],
        //     actions: ["filter",  "column", "group_by",],
        //     icon: "mdi-tag-outline",
        //     booleanValues: ["No PMC ID", "Has PMC ID"],
        // },
        {
            key: "is_retracted",
            entityType: "works",
            displayName: "retracted",
            type: "boolean",
            booleanValues: ["Isn't retracted", "Is retracted"],
            categories: ["other"],
            category: "other",
            isList: false,
            actions: ["filter", "column", "group_by",],
            icon: "mdi-close-octagon",
            isMultiple: false,
        },
        {
            key: "language",
            entityId: "languages",
            entityType: "works",
            displayName: "language",
            type: "select",
            displayNullAs: "Unknown",
            categories: ["other"],
            category: "other",
            isList: false,
            actions: ["filter", "column", "group_by",],
            actionsPopular: ["column", "group_by"],
            icon: "mdi-translate",
            isMultiple: false,
        },
        {
            key: "sustainable_development_goals.id",
            entityId: "sdgs",
            entityType: "works",
            displayName: "Sustainable Development Goal",
            type: "select",
            displayNullAs: "Unknown",
            categories: ["other", "popular"],
            category: "other",
            isList: true,
            actions: ["filter", "group_by",],
            icon: "mdi-sprout-outline",
            isMultiple: true,
            extractFn: (entity) => entity.sustainable_development_goals
        },


        {
            key: "cited_by_count",
            entityType: "works",
            displayName: "citation count",
            type: "range",
            sortByValue: true,
            placeholders: ["min", "max"],
            categories: ["citation"],
            category: "citation",
            isList: false,
            actions: ["filter", "sort", "column",],
            actionsPopular: ["sort", "column",],
            isCore: true,
            icon: "mdi-format-quote-close",
            isMultiple: false,
        },
        {
            key: "cited_by_percentile_year.min",
            entityType: "works",
            displayName: "Citation percentile (year)",
            type: "range",
            sortByValue: true,
            placeholders: ["min", "max"],
            categories: ["citation"],
            category: "citation",
            isList: false,
            actions: ["filter", "sort", "column",],
            actionsPopular: ["sort", "column",],
            isCore: true,
            icon: "mdi-format-quote-close",
            isMultiple: false,
        },
        {
            key: "cited_by",
            entityType: "works",
            displayName: "cited by",
            isVerb: true, // need to know how to display the name
            showNameInChip: true,
            isEntity: true,
            showInSidebar: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            type: "select", // used to be "entity"
            categories: ["citation"],
            category: "citation",
            isList: true,
            actions: [],
            icon: "mdi-format-quote-close",
            isMultiple: true,
            isDisplayedAsCount: true,
            extractFn: (entity) => entity.cited_by_count,
        },
        {
            key: "cites",
            entityType: "works",
            displayName: "cites",
            isVerb: true, // need to know how to display the name
            isEntity: true,
            showInSidebar: true,
            showNameInChip: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            type: "select", // used to be "entity"
            categories: ["citation"],
            category: "citation",
            isList: true,
            actions: [],
            icon: "mdi-format-quote-close",
            isMultiple: true,
            isDisplayedAsCount: true,
            extractFn: (entity) => entity.referenced_works.length,
        },
        {
            key: "related_to",
            entityType: "works",
            displayName: "related to",
            isVerb: true, // need to know how to display the name
            isEntity: true,
            showInSidebar: true,
            showNameInChip: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            type: "select", // used to be "entity"
            categories: ["other"],
            category: "other",
            isList: true,
            actions: ["filter",],
            isHidden: true,
            icon: "mdi-book-open-outline",
            isMultiple: true,
            isDisplayedAsCount: true,
            extractFn: (entity) => entity.related_works.length,
        },


        // works: other

        {
            key: "locations_count",
            entityType: "works",
            displayName: "sources count",
            type: "range",
            sortByValue: true,
            placeholders: ["min", "max"],
            categories: ["other"],
            category: "source",
            isList: false,
            actions: ["filter", "sort", "column",],
            icon: "mdi-account-outline",
            isMultiple: false,
        },


        // authors
        {
            key: "ids.openalex",
            entityType: "authors",
            entityId: "authors",
            pidPrefix: "openalex",
            displayName: "Author",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-account-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "ids.orcid",
            entityType: "authors",
            entityId: "authors",
            pidPrefix: "orcid",
            displayName: "ORCID",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "select",
            categories: ["other"],
            icon: "mdi-account-outline",
            extractFn: (e) => e.ids.orcid
        },
        {
            key: "display_name.search",
            entityType: "authors",
            isDefault: true,
            displayName: "Name search",
            type: "search",
            categories: ["search"],
            icon: "mdi-magnify",
        },
        {
            key: "last_known_institution.id",
            entityType: "authors",
            displayName: "Institution",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            type: "select",
            isManyOptions: true,
            categories: ["institution"],
            icon: "mdi-town-hall",
            extractFn: (entity) => entity.last_known_institution,
        },
        {
            key: "last_known_institution.country_code",
            entityType: "authors",
            displayName: "Institution country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            type: "select",
            isCountry: true,
            categories: ["geo"],
            icon: "mdi-town-hall",
        },
        {
            key: "last_known_institution.type",
            entityType: "authors",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            type: "select",
            categories: ["institution"],
            icon: "mdi-town-hall",
        },
        {
            key: "has_orcid",
            entityType: "authors",
            displayName: "Indexed by ORCID",
            type: "boolean",
            booleanValues: ["No ORCID", "Has ORCID"],
            categories: ["ids"],
            icon: "mdi-tag-outline",
        },
        {
            key: "x_concepts.id",
            entityType: "authors",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            type: "select",
            isManyOptions: true,
            categories: ["other"],
            icon: "mdi-tag-outline",
        },
        {
            key: "display_name_alternatives",
            entityType: "authors",
            displayName: "alternate names",
            type: "select",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            isMultiple: true,
            extractFn: (entity) => entity.display_name_alternatives,
        },


        // sources
        {
            key: "ids.openalex",
            entityType: "sources",
            entityId: "sources",
            pidPrefix: "openalex",
            displayName: "Source",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-book-open-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "ids.issn",
            entityType: "sources",
            entityId: "sources",
            pidPrefix: "issn",
            displayName: "ISSNs",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-book-open-outline",
            extractFn: (e) => e.issn
        },
        {
            key: "display_name.search",
            entityType: "sources",
            isDefault: true,
            displayName: "Title search",
            type: "search",
            categories: ["search"],
            icon: "mdi-magnify",
        },
        {
            key: "publisher",
            entityType: "sources",
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/sources/publisher",
            type: "select",
            isManyOptions: true,
            categories: ["popular"],
            icon: "mdi-book-open-outline",
            extractFn: (e)=> {
                if (e.type !== "journal") return
                return {
                    id: e.host_organization,
                    display_name: e.host_organization_name,
                }
            },
        },
        {
            key: "type",
            entityType: "sources",
            displayName: "Source type",
            type: "select",
            categories: ["popular"],
            icon: "mdi-book-open-outline",
            extractFn: (e)=> e.type,
        },
        {
            key: "apc_usd",
            entityType: "sources",
            displayName: "Article Processing Charge",
            type: "select",
            categories: ["popular"],
            icon: "mdi-book-open-outline",
            extractFn: (e)=> {
                if (!e.apc_usd) return
                return "$" + e.apc_usd.toLocaleString()
            },
        },
        {
            key: "is_oa",
            entityType: "sources",
            displayName: "Open Access",
            type: "boolean",
            categories: ["open access"],
            icon: "mdi-lock-open-outline",
            extractFn: (e)=> e.is_oa,
        },
        {
            key: "is_in_doaj",
            entityType: "sources",
            displayName: "In DOAJ",
            type: "boolean",
            categories: ["open access"],
            icon: "mdi-lock-open-outline",
            extractFn: (entity) => entity.is_in_doaj,
        },
        {
            key: "alternate_titles",
            entityType: "sources",
            displayName: "alternate names",
            type: "select",
            actions: [],
            actionsPopular: [],
            icon: "mdi-book-open-outline",
            isMultiple: true,
            extractFn: (entity) => entity.alternate_titles,
        },
        {
            key: "x_concepts.id",
            entityType: "sources",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            type: "select",
            isManyOptions: true,
            categories: ["other"],
            icon: "mdi-tag-outline",
        },


        // publishers
        {
            key: "ids.openalex",
            entityType: "publishers",
            entityId: "publishers",
            pidPrefix: "openalex",
            displayName: "Publisher",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-domain",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "display_name.search",
            entityType: "publishers",
            isDefault: true,
            displayName: "Name search",
            type: "search",
            categories: ["search"],
            icon: "mdi-magnify",
        },


        // funders
        {
            key: "ids.openalex",
            entityType: "funders",
            entityId: "funders",
            pidPrefix: "openalex",
            displayName: "Funder",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-cash-multiple",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "display_name.search",
            entityType: "funders",
            isDefault: true,
            displayName: "Name search",
            type: "search",
            categories: ["search"],
            icon: "mdi-magnify",
        },


        // institutions
        {
            key: "ids.openalex",
            entityType: "institutions",
            entityId: "institutions",
            pidPrefix: "openalex",
            displayName: "Institution",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-town-hall",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },

        {
            key: "ids.ror",
            entityType: "institutions",
            entityId: "institutions",
            pidPrefix: "ror",
            displayName: "ROR",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "select",
            categories: ["other"],
            icon: "mdi-town-hall",
            extractFn: (e) => e.ids.ror,
        },
        {
            key: "display_name.search",
            entityType: "institutions",
            isDefault: true,
            displayName: "Name search",
            type: "search",
            categories: ["search"],
            icon: "mdi-magnify",
        },
        {
            key: "country_code",
            entityType: "institutions",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            type: "select",
            isManyOptions: true,
            isCountry: true,
            categories: ["geo"],
            icon: "mdi-map-marker-outline"
        },
        {
            key: "type",
            entityType: "institutions",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            type: "select",
            categories: ["popular"],
            icon: "mdi-town-hall"
        },
        {
            key: "x_concepts.id",
            entityType: "institutions",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            type: "select",
            isManyOptions: true,
            categories: ["other"],
            icon: "mdi-tag-outline",
        },
        {
            key: "display_name_alternatives",
            entityType: "institutions",
            displayName: "alternate names",
            type: "select",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            isMultiple: true,
            extractFn: (entity) => entity.display_name_alternatives,
        },
        {
            key: "parent_institutions",
            entityType: "institutions",
            displayName: "parent institutions",
            type: "select",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            isMultiple: true,
            extractFn: (entity) => entity.associated_institutions.filter(i =>{
                return i.relationship === "parent"
            }),
        },
        {
            key: "child_institutions",
            entityType: "institutions",
            displayName: "child institutions",
            type: "select",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            isMultiple: true,
            extractFn: (entity) => entity.associated_institutions.filter(i =>{
                return i.relationship === "child"
            }),
        },
        {
            key: "related_institutions",
            entityType: "institutions",
            displayName: "related institutions",
            type: "select",
            actions: [],
            actionsPopular: [],
            icon: "mdi-town-hall",
            isMultiple: true,
            extractFn: (entity) => entity.associated_institutions.filter(i =>{
                return i.relationship === "related"
            }),
        },


        // concepts
        {
            key: "ids.openalex",
            entityType: "concepts",
            entityId: "concepts",
            pidPrefix: "openalex",
            displayName: "Concept",
            isEntity: true,
            isId: true,
            noOptions: true,
            type: "entity",
            categories: ["other"],
            icon: "mdi-tag-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "display_name.search",
            entityType: "concepts",
            isDefault: true,
            displayName: "Name search",
            type: "search",
            categories: ["search"],
            icon: "mdi-magnify",
        },
        {
            key: "level",
            entityType: "concepts",
            displayName: "Level",
            maxPotentialFiltersToShow: 10,
            type: "select",
            categories: ["popular"],
            icon: "mdi-tag-outline"
        },

        // topics
        {
            key: "description",
            entityType: "topics",
            entityId: "topics",
            displayName: "description",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "siblings",
            entityType: "topics",
            entityId: "topics",
            displayName: "related topics (siblings)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },
        {
            key: "subfield",
            entityType: "topics",
            entityId: "topics",
            displayName: "subfield (parent)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.subfield,
        },
        {
            key: "field",
            entityType: "topics",
            entityId: "topics",
            displayName: "field",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.field,
        },
        {
            key: "domain",
            entityType: "topics",
            entityId: "topics",
            displayName: "domain",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.domain,
        },



        // subfields
        {
            key: "description",
            entityType: "subfields",
            entityId: "subfields",
            displayName: "description",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityType: "subfields",
            entityId: "subfields",
            displayName: "alternate names",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.display_name_alternatives,
        },
        {
            key: "topics",
            entityType: "subfields",
            entityId: "subfields",
            displayName: "topics (children)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.topics,
        },
        {
            key: "siblings",
            entityType: "subfields",
            entityId: "subfields",
            displayName: "related subfields (siblings)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },
        {
            key: "field",
            entityType: "subfields",
            entityId: "subfields",
            displayName: "field (parent)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.field,
        },
        {
            key: "domain",
            entityType: "subfields",
            entityId: "subfields",
            displayName: "domain",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.domain,
        },


        // fields
        {
            key: "description",
            entityType: "fields",
            entityId: "fields",
            displayName: "description",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityType: "fields",
            entityId: "fields",
            displayName: "alternate names",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.display_name_alternatives,
        },
        {
            key: "siblings",
            entityType: "fields",
            entityId: "fields",
            displayName: "related fields (siblings)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },
        {
            key: "subfields",
            entityType: "fields",
            entityId: "fields",
            displayName: "subfields (children)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.subfields,
        },
        {
            key: "domain",
            entityType: "fields",
            entityId: "fields",
            displayName: "domain (parent)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.domain,
        },




        // domains
        {
            key: "description",
            entityType: "domains",
            entityId: "domains",
            displayName: "description",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "display_name_alternatives",
            entityType: "domains",
            entityId: "domains",
            displayName: "alternate names",
            type: "search",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.display_name_alternatives,
        },
        {
            key: "fields",
            entityType: "domains",
            entityId: "domains",
            displayName: "fields (children)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.fields,
        },
        {
            key: "siblings",
            entityType: "domains",
            entityId: "domains",
            displayName: "other domains (siblings)",
            type: "select",
            categories: ["other"],
            icon: "mdi-tag-outline",
            extractFn: (e) => e.siblings,
        },

        // types
        {
            key: "description",
            entityType: "types",
            entityId: "types",
            displayName: "description",
            type: "search",
            categories: ["other"],
            icon: "mdi-shape-outline",
            extractFn: (e) => e.description,
        },
        {
            key: "crossref_types",
            entityType: "types",
            entityId: "types",
            displayName: "alternate names (Crossref)",
            type: "select",
            categories: ["other"],
            icon: "mdi-shape-outline",
            extractFn: (e) => e.crossref_types,
        },



    ]

    const worksCountFilters = getEntityConfigs()
        .map(c => c.name)
        .filter(name => name !== 'works')
        .map(name => {
            return {
                key: "works_count",
                entityType: name,
                displayName: "works count",
                type: "range",
                sortByValue: true,
                category: "citation",
                actions: ["filter", "sort", "column", "group_by",],
                actionsPopular: ["sort", "column", "group_by",],
                icon: "mdi-format-quote-close",
                isMultiple: true,
                isDisplayedAsCount: true,
                extractFn: (entity) => entity.works_count,
            }
        })

    const citedByCountFilters = getEntityConfigs()
        .map(c => c.name)
        .filter(name => name !== 'works')
        .map(name => {
            return {
                key: "cited_by_count",
                entityType: name,
                displayName: "cited by",
                type: "range",
                sortByValue: true,
                category: "citation",
                actions: ["filter", "sort", "column", "group_by",],
                actionsPopular: ["sort", "column", "group_by",],
                icon: "mdi-format-quote-close",
                isMultiple: true,
                isDisplayedAsCount: true,
                extractFn: (entity) => entity.cited_by_count,
            }
        })

    const allConfigs = [
        ...ret,
        ...worksCountFilters,
        ...citedByCountFilters,
    ]


    const manipulated = allConfigs
        // .filter(f => onlyReturnTheseFacets.includes(f.key))
        .map(config => {
            return {
                ...config,
                // values: [],
            }
        })
        .filter(config => {
            return !entityType || config.entityType === entityType
        })

    manipulated.sort((a, b) => {
        return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : -1
    })

    return manipulated
}

const getFacetConfigFromPid = function (pid) {
    const trimmedPid = pid.trim()
    const x = facetConfigs().find(f => {

    })
    return x


}


const getFacetConfig = function (entityType, key) {
    if (!key || !entityType) return
    // hack time
    if (key === "relevance_score") {
        return {
            key: "relevance_score",
            displayName: "Relevance score",
            icon: "mdi-magnify",
            type: "search",
        }
    }

    // more hack time
    key = key.replace("primary_location.source.host_organization_lineage", "primary_location.source.publisher_lineage")


    const myFacetConfig = facetConfigs().find(f => f.key === key && f.entityType === entityType)
    if (!myFacetConfig) {
        const msg = `openAlex error: getFacetConfig(): no facet found for '${entityType}' filter "${key}"`
        console.log(msg)
        throw new Error(msg)

    }
    return myFacetConfig
}


const makeFacet = function (key, isNegated, values) {
    return {
        key,
        isNegated,
        values,
        config: facetConfigs()[key]

    }
}

const findFacetConfigs = function (entityType, searchString) {
    const ret = facetConfigs(entityType)
        .filter(c => {
            return c.entityType === entityType
        })
        .filter(c => {
            return c.displayName.toLowerCase().match(searchString?.toLowerCase())
        })

    const sorted = sortByKey(ret, "displayName")
    return sorted
}


const facetsByCategory = function (
    entityType,
    searchString = "",
    includeOnlyTypes = [],
    excludeFiltersByKey = [],
) {
    const filtered = facetConfigs(entityType)
        .filter(c => {
            return !searchString || c.displayName.toLowerCase().match(searchString?.toLowerCase())
        })
        .filter(c => {
            return !includeOnlyTypes.length || includeOnlyTypes.includes(c.type)
        })
        .filter(c => {
            return !excludeFiltersByKey.length || !excludeFiltersByKey.includes(c.key)
        })


    return facetCategories[entityType].map(categoryName => {
        const myFacets = filtered.filter(f => {
            return f.categories.includes(categoryName)
        })

        return {
            displayName: categoryName,
            icon: facetCategoriesIcons[categoryName],
            filterConfigs: myFacets,
        }
    })
        .filter(categoryObj => {
            return categoryObj.filterConfigs.length > 0
        })
        .filter(categoryObj => {
            return !(searchString && categoryObj.displayName === "popular")
        })


}


export {
    makeFacet,
    facetConfigs,
    getFacetConfig,
    facetCategories,
    facetsByCategory,
    findFacetConfigs,
}






