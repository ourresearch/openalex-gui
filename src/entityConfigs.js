
// color ideas!
// https://www.heavy.ai/blog/12-color-palettes-for-telling-better-stories-with-your-data
// https://carbondesignsystem.com/data-visualization/color-palettes/

const entityConfigs = {
    works: {
        emoji: "📄",
        icon: "mdi-file-document-outline",
        name: "works",
        nameSingular: "work",
        displayName: "work",
        displayNameSingular: "work",
        descr: "Scholarly papers, books, datasets, etc.",
        eg: "On the Electrodynamics of Moving Bodies",
        placeholder: "Search scholarly papers, books, and more",
        filterName: "work",
        filterKey: "ids.openalex"
    },
    authors: {
        emoji: "🧑",
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
    },
    sources: {
        emoji: "📚",
        // icon: "mdi-book-outline",
        icon: "mdi-book-open-outline",
        name: "sources",
        nameSingular: "source",
        displayName: "sources",
        displayNameSingular: "source",
        descr: "Journals, conferences, and repositories",
        eg: "The New England Journal of Medicine",
        placeholder: "Search academic journals & repositories",
        filterName: "locations.source",
        filterKey: "locations.source.id",
    },
    publishers: {
        emoji: "📚",
        // icon: "mdi-book-outline",
        icon: "mdi-domain",
        name: "publishers",
        nameSingular: "publisher",
        displayName: "publishers",
        displayNameSingular: "publisher",
        descr: "Company hosting journals",
        eg: "Elsevier",
        placeholder: "Search academic publishers",
        filterName: "locations.source.host_organization_lineage",
        filterKey: "locations.source.host_organization_lineage",
    },
    funders: {
        emoji: "💰",
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
    },
    institutions: {
        emoji: "🏫",
        icon: "mdi-town-hall",
        name: "institutions",
        nameSingular: "institution",
        displayName: "institutions",
        displayNameSingular: "institution",
        descr: "Universities and research centers",
        eg: "Harvard University",
        placeholder: "Search academic institutions",
        filterName: "institutions",
        filterKey: "authorships.institutions.id",
    },
    concepts: {
        emoji: "💡",
        icon: "mdi-lightbulb-outline",
        name: "concepts",
        nameSingular: "concept",
        displayName: "concepts",
        displayNameSingular: "concept",
        descr: "Topics and fields of study",
        eg: "History",
        placeholder: "Search topics",
        filterName: "concepts",
        filterKey: "concepts.id",
    },
}

const getEntityConfig = function(name) {
    return Object.values(entityConfigs).find(c => {
        return c.nameSingular === name || c.displayName === name
    })
}

export {
    entityConfigs,
    getEntityConfig,
}