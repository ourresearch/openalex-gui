const idConfigs = {


    // mutliple entities
    openalex: {
        namespace: "openalex",
        provider: "OpenAlex",
        prefix: "https://openalex.org/",
        isUrl: true,
    },
    wikipedia: {
        namespace: "wikipedia",
        provider: "Wikipedia",
        prefix: "https://en.wikipedia.org/wiki/",
        isUrl: true,
    },
    wikidata: {
        namespace: "wikidata",
        provider: "Wikidata",
        prefix: "https://www.wikidata.org/wiki/",
        isUrl: true,
    },

    // works
    doi: {
        namespace: "doi",
        provider: "Crossref",
        prefix: "https://doi.org/",
        urlPattern: "https://search.crossref.org/?from_ui=yes&q=",
        isUrl: true,
        isCanonical: true,
    },
    pmid: {
        namespace: "pmid",
        provider: "PubMed",
        prefix: "https://pubmed.ncbi.nlm.nih.gov/",
        isUrl: true,
    },
    pmcid: {
        namespace: "pmcid",
        provider: "PubMed Central",
        prefix: "https://www.ncbi.nlm.nih.gov/pmc/",
        isUrl: true,
    },

    // authors
    orcid: {
        namespace: "orcid",
        provider: "ORCiD",
        prefix: "https://orcid.org/",
        isUrl: true,
        isCanonical: true,
    },
    twitter: {
        namespace: "twitter",
        provider: "Twitter",
        prefix: "https://twitter.com/",
        isUrl: true,
    },

    // venues
    issn_l: {
        namespace: "issn_l",
        provider: "The ISSN International Centre",
        urlPattern: "https://portal.issn.org/resource/ISSN/",
        isCanonical: true,
        isUrl: false,
    },
    issn: {
        namespace: "issn",
        provider: "The ISSN International Centre",
        urlPattern: "https://portal.issn.org/resource/ISSN/",
        prefix: "https://twitter.com/",
        isUrl: false,
        isArray: true,
    },

    // institutions
    ror: {
        namespace: "ror",
        provider: "The Research Organization Registry",
        urlPattern: "https://ror.org/",
        isCanonical: true,
        isUrl: true,
    },

    // concepts
    // nothing to add here
}

export {
    idConfigs,
}