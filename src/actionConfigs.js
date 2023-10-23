const actionConfigs = [
    {
        id: "filter",
        displayName: "Filter",
        isMultiple: true,
        topValues: [
            "authorships.institutions.lineage",
            "authorships.author.id",
            "default.search",
            "open_access.is_oa",
            "type",
            "publication_year",
            "sustainable_development_goals.id",
        ],
        defaultValues: [],
        getDefaultValues(){return []},
        appendToValues: "",
    },
    {
        id: "group_by",
        displayName: "Group by",
        isMultiple: false,
        topValues: [
            "authorships.institutions.lineage",
            "authorships.author.id",
            "open_access.is_oa",
            "type",
            "publication_year",
            "sustainable_development_goals.id",
        ],
        defaultValues: [],
        getDefaultValues(){return []},
        appendToValues: "",
    },
    {
        id: "sort",
        displayName: "Sort",
        isMultiple: true,
        topValues: [
            "publication_date",
            "cited_by_count",
            "relevance_score",
        ],
        getDefaultValues: function (query) {
            const isSearchFilterApplied = query?.filter?.split(",")?.some(f => {
                return f.split(":")[0]?.indexOf(".search") > -1
            })
            return [ isSearchFilterApplied ? "relevance_score" : "cited_by_count" ]
        },

        // this is too complicated for a config file...you need to look in the URL
        // to see if a search is set or not. so it's handled via a function url.js
        defaultValues: [],
        appendToValues: ":desc",

    },
    {
        id: "column",
        displayName: "Column",
        isMultiple: true,
        topValues: [
            "publication_year",
            "type",
            "open_access.is_oa",
            "cited_by_count",
        ],
        getDefaultValues(query){return [
            "display_name",
            "publication_year",
            "type",
            "open_access.is_oa",
            "cited_by_count",
        ]},
        appendToValues: "",
    },
]

const getActionConfig = function (id) {
    return actionConfigs.find(c => c.id === id)
}
const getActionDefaultValues = function(id, query){
    return getActionConfig(id).getDefaultValues(query)
}
const getActionDefaultsStr = function(id, query){
    const myConfig = getActionConfig(id)
    return getActionDefaultValues(id, query)
        .map(v => v + myConfig.appendToValues)
        .join(",")

}


export {
    actionConfigs,
    getActionConfig,
    getActionDefaultValues,
    getActionDefaultsStr,
}

