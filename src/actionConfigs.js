const actionConfigs = [
    {
        id: "filter",
        displayName: "Filter",
        isMultiple: true,
        isMandatory: false,
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
        icon: "mdi-filter-outline",
        color: "primary",
        closeMenuOnContentClick: false,
    },


    {
        id: "group_by",
        displayName: "Count",
        isMultiple: true,
        isMandatory: false,
        topValues: [
            "authorships.institutions.lineage",
            "authorships.author.id",
            "open_access.is_oa",
            "type",
            "publication_year",
            "sustainable_development_goals.id",
        ],
        defaultValues: [
            "authorships.institutions.lineage",
            "open_access.is_oa",
            "type",
            "publication_year",

        ],
        getDefaultValues(query){return [
            "authorships.institutions.lineage",
            "open_access.is_oa",
            "type",
            "publication_year",
        ]},
        appendToValues: "",
        icon: "mdi-poll",
        isIconRotated: true,
        color: "purple",
        closeMenuOnContentClick: true,
    },


    {
        id: "sort",
        displayName: "Sort",
        isMultiple: false,
        isMandatory: true,
        topValues: [
            "publication_date",
            "cited_by_count",
            "relevance_score",
            // "cited_by_percentile_year.min",
        ],
        getDefaultValues: function (query) {
            const isSearchFilterApplied = query?.filter?.split(",")?.some(f => {
                return f.split(":")[0]?.indexOf(".search") > -1
            })
            // return [ isSearchFilterApplied ? "relevance_score" : "cited_by_count" ]
            return [ isSearchFilterApplied ? "relevance_score" : "cited_by_count" ]
        },

        // this is too complicated for a config file...you need to look in the URL
        // to see if a search is set or not. so it's handled via a function url.js
        defaultValues: [],
        appendToValues: ":desc",
        icon:"mdi-sort-ascending",
        color: "deep-orange",
        closeMenuOnContentClick: false,

    },


    {
        id: "column",
        displayName: "Column",
        isMultiple: true,
        isMandatory: true,
        disableKeys: [
            "display_name",
        ],
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
        icon: "mdi-view-column-outline",
        color: "green",
        closeMenuOnContentClick: false,
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

