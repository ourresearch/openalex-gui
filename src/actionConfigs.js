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
    },
    {
        id: "sort",
        displayName: "Sort",
        isMultiple: true,
        topValues: [
          "publication_date",
          "cited_by_count",
        ],
        defaultValues: [
            "cited_by_count",
        ]

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
        defaultValues:  [
          "publication_year",
          "type",
          "open_access.is_oa",
          "cited_by_count",
        ],
    },
]

const getActionConfig = function(id){
    return actionConfigs.find(c => c.id===id)
}


export {
    actionConfigs,
    getActionConfig,
}

