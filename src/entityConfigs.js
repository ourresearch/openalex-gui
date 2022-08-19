const entityConfigs = {
    works: {
        emoji: "📄",
        icon: "mdi-file-document-outline",
        name: "works",
        displayName: "works",
        descr: "Scholarly papers, books, datasets, etc.",
        eg: "On the Electrodynamics of Moving Bodies",
        placeholder: "Search 230M scholarly papers, books, and more",
        filterName: "work",
    },
    authors: {
        emoji: "🧑",
        // icon: "mdi-account-school-outline",
        icon: "mdi-account-outline",
        name: "authors",
        displayName: "people",
        descr: "Creators of scholarly works",
        eg: "Albert Einstein",
        placeholder: "Search 200M scholarly authors",
        filterName: "author",
    },
    venues: {
        emoji: "📚",
        // icon: "mdi-book-outline",
        icon: "mdi-book-open-page-variant-outline",
        name: "venues",
        displayName: "journals",
        descr: "Academic journals and content repositories",
        eg: "The New England Journal of Medicine",
        placeholder: "Search 100k academic journals & repositories",
        filterName: "host_venue",
    },
    institutions: {
        emoji: "🏫",
        icon: "mdi-town-hall",
        name: "institutions",
        displayName: "institutions",
        descr: "Universities and research centers",
        eg: "Harvard University",
        placeholder: "Search 100k academic institutions",
        filterName: "institutions",
    },
    concepts: {
        emoji: "💡",
        icon: "mdi-lightbulb-outline",
        name: "concepts",
        displayName: "concepts",
        descr: "Topics and fields of study",
        eg: "History",
        placeholder: "Search 50k topics",
        filterName: "concepts",
    },


}

export {
    entityConfigs,
}