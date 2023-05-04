const facetCategories = {
    works: [
        "popular",
        "institution",
        "author",
        "access",
        "main source",
        "repository",
        "search",
        "geo",
        "funder",
        "ids",
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
        "access",
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
    geo: "mdi-map-marker-outline",
    funder: "mdi-cash-multiple",
    "main source": "mdi-book-multiple-outline",
    repository: "mdi-package-variant",
    search: "mdi-magnify",
    access: "mdi-lock-open-outline",
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
            valuesToShow: "select",
            category: "other",
            icon: "mdi-file-document-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([wW]\d+)$/,
        },
        {
            key: "doi",
            entityType: "works",
            entityId: "works",
            displayName: "DOI (work)",
            isEntity: true,
            isSingleWork: true,
            isId: true,
            pidPrefix: "doi",
            showInSidebar: true,
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            icon: "mdi-file-document-outline",
            regex: /(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/,
        },
        {
            key: "concepts.id",
            entityType: "works",
            displayName: "Concept",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            isCore: true,
            icon: "mdi-lightbulb-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([cC]\d+)$/,
        },
        {
            key: "grants.funder",
            entityType: "works",
            displayName: "Funder name",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "funders",
            valuesToShow: "mostCommon",
            category: "funder",
            isCore: true,
            icon: "mdi-cash-multiple",
            regex: /^(?:https:\/\/openalex\.org\/)?([fF]\d+)$/,
        },
        {
            key: "grants.award_id",
            entityType: "works",
            displayName: "Grant ID",
            showInSidebar: true,
            valuesToShow: "mostCommon",
            category: "funder",
            isCore: true,
            icon: "mdi-cash-multiple",
        },

        {
            key: "authorships.institutions.id",
            entityType: "works",
            displayName: "Institution",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
            category: "institution",
            isCore: true,
            icon: "mdi-town-hall",
            regex: /^(?:https:\/\/openalex\.org\/)?([iI]\d+)$/,
        },

        {
            key: "authorships.institutions.ror",
            entityType: "works",
            entityId: "institutions",
            displayName: "ROR (institution)",
            pidPrefix: "ror",
            isEntity: true,
            isId: true,
            showInSidebar: true,
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            icon: "mdi-town-hall",
            regex: /https?:\/\/ror\.org\/(0[a-zA-Z0-9]+)/,
        },

        {
            key: "authorships.author.id",
            entityType: "works",
            displayName: "Author name",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "authors",
            autocompleteEndpoint: "autocomplete/authors",
            valuesToShow: "mostCommon",
            category: "author",
            isCore: true,
            icon: "mdi-account-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([aA]\d+)$/,
        },


        {
            key: "authorships.author.orcid",
            entityType: "works",
            entityId: "authors",
            displayName: "ORCID (author)",
            pidPrefix: "orcid",
            isEntity: true,
            isId: true,
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            icon: "mdi-account-outline",
            regex: /https?:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/,
        },


        // works: search

        {
            key: "default.search",
            entityType: "works",
            displayName: "Fulltext search",
            valuesToShow: "search",
            category: "popular",
            isCore: true,
            isSearch: true,
            icon: "mdi-magnify",
        },
        {
            key: "title.search",
            entityType: "works",
            displayName: "Search title only",
            valuesToShow: "search",
            category: "search",
            isCore: true,
            isSearch: true,
            icon: "mdi-magnify",
        },
        {
            key: "abstract.search",
            entityType: "works",
            displayName: "Search abstract only",
            valuesToShow: "search",
            category: "search",
            isCore: true,
            isSearch: true,
            icon: "mdi-magnify",
        },

        {
            key: "has_abstract",
            entityType: "works",
            displayName: "Indexing status (abstract)",
            isBoolean: true,
            booleanValues: ["No indexed abstract", "Has indexed abstract"],
            valuesToShow: "mostCommon",
            category: "search",
            icon: "mdi-file-document-outline",
        },
        {
            key: "has_ngrams",
            entityType: "works",
            isBoolean: true,
            displayName: "Indexing status (fulltext)",
            booleanValues: ["No indexed fulltext", "Has indexed fulltext"],
            valuesToShow: "mostCommon",
            category: "search",
            icon: "mdi-file-document-outline",
        },

        // {
        //     key: "fulltext.search",
        //     entityType: "works",
        //     displayName: "Search fulltext",
        //     valuesToShow: "search",
        //     category: "search",
        //     isCore: true,
        //     isSearch: true,
        //     icon: "mdi-magnify",
        // },



        // works: authors

        {
            key: "authors_count",
            entityType: "works",
            displayName: "Authors Count",
            valuesToShow: "range",
            sortByValue: true,
            isRange: true,
            placeholders: ["min", "max"],
            category: "author",
            icon: "mdi-account-outline",
        },
        {
            key: "corresponding_author_ids",
            entityType: "works",
            displayName: "Corresponding author",
            valuesToShow: "mostCommon",
            category: "author",
            icon: "mdi-account-outline",
        },


        // works: open access
        {
            key: "open_access.is_oa",
            entityType: "works",
            displayName: "Open Access",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Toll-access", "Open Access"],
            category: "popular",
            isCore: true,
            icon: "mdi-lock-open-outline",
        },
        {
            key: "best_oa_location.license",
            entityType: "works",
            displayName: "License",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "open_access.oa_status",
            entityType: "works",
            displayName: "OA Color",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "best_oa_location.version",
            entityType: "works",
            displayName: "Open Access version",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },


        // works: institutions:
        {
            key: "authorships.institutions.country_code",
            entityType: "works",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "geo",
            isCore: true,
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.continent",
            entityType: "works",
            displayName: "Continent",
            valuesToShow: "mostCommon",
            category: "geo",
            isCore: true,
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.is_global_south",
            entityType: "works",
            displayName: "Hemisphere",
            category: "geo",
            isBoolean: true,
            booleanValues: ["Global North", "Global South"],
            icon: "mdi-map-marker-outline",
            // icon: "mdi-town-hall",
        },
        {
            key: "authorships.institutions.type",
            entityType: "works",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },
        {
            key: "corresponding_institution_ids",
            entityType: "works",
            displayName: "Corresponding institutions",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },


        // works: primary source

        {
            key: "primary_location.source.id",
            entityType: "works",
            displayName: "Main source name",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            entityId: "sources",
            autocompleteEndpoint: "autocomplete/sources",
            valuesToShow: "mostCommon",
            category: "main source",
            isCore: true,
            icon: "mdi-file-document-multiple-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([sS]\d+)$/,
        },

        {
            key: "primary_location.source.issn",
            entityType: "works",
            entityId: "sources",
            displayName: "ISSN (Source)",
            isEntity: true,
            isId: true,
            pidPrefix: "issn",
            showInSidebar: true,
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            icon: "mdi-file-document-multiple-outline",
            regex: /^(\b\d{4}-\d{3}[\dX]\b)$/,
        },
        {
            key: "primary_location.source.type",
            entityType: "works",
            displayName: "Main source type",
            valuesToShow: "mostCommon",
            category: "main source",
            icon: "mdi-file-document-multiple-outline",
        },

        {
            key: "primary_location.source.publisher_lineage",
            entityType: "works",
            entityId: "publishers",
            displayName: "Main source publisher",
            pidPrefix: "openalex",
            isEntity: true,
            showInSidebar: true,
            // entityId: "publishers",
            autocompleteEndpoint: "autocomplete/publishers",
            valuesToShow: "mostCommon",
            category: "main source",
            isCore: true,
            icon: "mdi-home-city-outline",
            regex: /^(?:https:\/\/openalex\.org\/)?([pP]\d+)$/,
        },




        // works: repository

        {
            key: "repository",
            entityType: "works",
            displayName: "Repository name",
            isEntity: true,
            showInSidebar: true,
            entityId: "sources",
            valuesToShow: "mostCommon",
            category: "repository",
            isCore: true,
            icon: "mdi-file-document-multiple-outline",
        },
        {
            key: "open_access.any_repository_has_fulltext",
            entityType: "works",
            displayName: "Repository availability",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Not in any repository", "In a repository"],
            category: "repository",
            icon: "mdi-database-outline",
        },




        // works: intrinsic

        {
            key: "type",
            entityType: "works",
            displayName: "Work type",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-file-document-outline",
        },
        {
            key: "publication_year",
            entityType: "works",
            displayName: "Publication year",
            valuesToShow: "range",
            sortByValue: true,
            isRange: true,
            placeholders: ["earliest", "latest"],
            category: "popular",
            isCore: true,
            icon: "mdi-calendar-text"
        },
        {
            key: "has_doi",
            entityType: "works",
            displayName: "DOI",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Has a DOI", "No DOI"],
            category: "ids",
            icon: "mdi-database-outline",
        },
        {
            key: "has_orcid",
            entityType: "works",
            displayName: "ORCID",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["No ORCID", "At least one ORCID", ],
            category: "ids",
            icon: "mdi-database-outline",
        },
        {
            key: "has_pmid",
            entityType: "works",
            displayName: "PubMed",
            valuesToShow: "boolean",
            isBoolean: true,
            category: "ids",
            icon: "mdi-database-outline",
            booleanValues: ["No PubMed ID", "Has PubMed ID"],
        },
        {
            key: "has_pmcid",
            entityType: "works",
            displayName: "PubMed Central",
            valuesToShow: "boolean",
            isBoolean: true,
            category: "ids",
            icon: "mdi-database-outline",
            booleanValues: ["No PMC ID", "Has PMC ID"],
        },
        {
            key: "is_retracted",
            entityType: "works",
            displayName: "Retraction status",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Isn't retracted", "Is retracted"],
            category: "other",
            icon: "mdi-file-document-outline"
        },
        {
            key: "is_paratext",
            entityType: "works",
            displayName: "Paratext",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Isn't paratext", "Is paratext"],
            category: "other",
            icon: "mdi-file-document-outline"
        },



        {
            key: "cited_by_count",
            entityType: "works",
            displayName: "Citation count",
            valuesToShow: "mostCommon",
            sortByValue: true,
            isRange: true,
            placeholders: ["min", "max"],
            category: "citation",
            isCore: true,
        },
        {
            key: "cited_by",
            entityType: "works",
            displayName: "Cited by",
            showNameInChip: true,
            isEntity: true,
            showInSidebar: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "citation",
            icon: "mdi-format-quote-close",
        },
        {
            key: "cites",
            entityType: "works",
            displayName: "Cites",
            isEntity: true,
            showInSidebar: true,
            showNameInChip: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "citation",
            icon: "mdi-format-quote-close",
        },
        {
            key: "related_to",
            entityType: "works",
            displayName: "Related to",
            isEntity: true,
            showInSidebar: true,
            showNameInChip: true,
            autocompleteEndpoint: "autocomplete/works",
            noOptions: true,
            valuesToShow: "select",
            category: "other",
            isHidden: true,
            icon: "mdi-file-document-multiple-outline",
        },


        // authors
        {
            key: "last_known_institution.id",
            entityType: "authors",
            displayName: "Institution name",
            isEntity: true,
            entityId: "institutions",
            autocompleteEndpoint: "autocomplete/institutions",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },
        {
            key: "last_known_institution.country_code",
            entityType: "authors",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "geo",
            icon: "mdi-map-marker-outline",
        },
        {
            key: "last_known_institution.type",
            entityType: "authors",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            valuesToShow: "mostCommon",
            category: "institution",
            icon: "mdi-town-hall",
        },
        {
            key: "has_orcid",
            entityType: "authors",
            displayName: "ORCID",
            valuesToShow: "boolean",
            isBoolean: true,
            booleanValues: ["Has ORCID", "No ORCID"],
            category: "ids",
            icon: "mdi-database-outline",
        },
        {
            key: "x_concepts.id",
            entityType: "authors",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            icon: "mdi-lightbulb-outline",
        },


        // sources
        {
            key: "publisher",
            entityType: "sources",
            displayName: "Publisher",
            autocompleteEndpoint: "autocomplete/sources/publisher",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-file-document-multiple-outline",
        },
        {
            key: "type",
            entityType: "sources",
            displayName: "Source type",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-file-document-multiple-outline",
        },
        {
            key: "is_oa",
            entityType: "sources",
            displayName: "Open Access",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "is_in_doaj",
            entityType: "sources",
            displayName: "In DOAJ",
            valuesToShow: "mostCommon",
            category: "access",
            icon: "mdi-lock-open-outline",
        },
        {
            key: "x_concepts.id",
            entityType: "sources",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            icon: "mdi-lightbulb-outline",
        },


        // institutions
        {
            key: "country_code",
            entityType: "institutions",
            displayName: "Country",
            autocompleteEndpoint: "autocomplete/institutions/country",
            valuesToShow: "mostCommon",
            isCountry: true,
            category: "geo",
            icon: "mdi-map-marker-outline"
        },
        {
            key: "type",
            entityType: "institutions",
            displayName: "Institution type",
            autocompleteEndpoint: "autocomplete/institutions/type",
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-town-hall"
        },
        {
            key: "x_concepts.id",
            entityType: "institutions",
            displayName: "Concepts",
            isEntity: true,
            entityId: "concepts",
            autocompleteEndpoint: "autocomplete/concepts",
            valuesToShow: "mostCommon",
            category: "other",
            icon: "mdi-lightbulb-outline",
        },


        // concepts
        {
            key: "level",
            entityType: "concepts",
            displayName: "Level",
            maxPotentialFiltersToShow: 10,
            valuesToShow: "mostCommon",
            category: "popular",
            icon: "mdi-lightbulb-outline"
        },
    ]


    return ret
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
}

const getFacetConfigFromPid = function (pid) {
    const trimmedPid = pid.trim()
    const x = facetConfigs().find(f => {

    })
    return x


}


const getFacetConfig = function (entityType, key) {
    const myFacetConfig = facetConfigs().find(f => f.key === key && f.entityType === entityType)
    if (!myFacetConfig) {
        const msg = `openAlex error: getFacetConfig: no facet found for ${entityType} filter "${key}"`
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


const facetsByCategory = function (entityType, resultsFilters, searchString) {
    const filtered = facetConfigs(entityType)
        .filter(c => {
            return c.entityType === entityType
        })
        .filter(c => {

            return c.displayName.toLowerCase().match(searchString?.toLowerCase())
        })
        .filter(c => {
            const filters = resultsFilters.filter(f => f.key === c.key)
            // hide the noOptions facets unless they have selected filters
            return !c.noOptions || filters.length
        })
        .map(c => {
            return {
                ...c,
                resultsFiltersCount: resultsFilters.filter(f => f.key === c.key).length,
            }
        })

    // filtered.sort((a, b) => {
    //     return (a.displayName > b.displayName) ? 1 : -1
    // })

    return facetCategories[entityType].map(categoryName => {
        const myFacets = filtered.filter(f => {
            return f.category === categoryName
        })
        const myResultsFiltersCount = myFacets
            .map(f => f.resultsFiltersCount)
            .reduce((a,b) => a + b, 0)

        return {
            name: categoryName,
            icon: facetCategoriesIcons[categoryName],
            facets: myFacets,
            resultsFiltersCount: myResultsFiltersCount,
        }
    })
        .filter(categoryObj => {
            return categoryObj.facets.length > 0
        })


}


export {
    makeFacet,
    facetConfigs,
    getFacetConfig,
    facetCategories,
    facetsByCategory,
}






