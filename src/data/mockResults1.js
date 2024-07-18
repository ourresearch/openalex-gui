const ret1  = {
    meta: {
        // ignoring for now
    },
    results: {
        header: [
            // configs from https://github.com/ourresearch/openalex-elastic-api/blob/master/config/property_config.py
            // first column
            {
                "key": "ids.openalex",
                "id": "ids.openalex",
                "entityType": "works",
                "subjectEntity": "works",
                "entityId": "works",
                "objectEntity": "works",
                "displayName": "Work",
                "isSingleWork": true,
                "isId": true,
                "type": "select",
                "newType": "entity",
                "category": "ids",
                "actions": [""],
                "icon": "mdi-file-document-outline",
                "extractFn": "(entity) => entity.id",
            },

            // second column
            {
                "key": "has_abstract",
                "id": "has_abstract",
                "entityType": "works",
                "subjectEntity": "works",
                "displayName": "Abstract available",
                "type": "boolean",
                "newType": "boolean",
                "actions": ["filter"],
                "icon": "mdi-file-document-outline",
            },

            // third column
            {
                "key": "primary_location.source.id",
                "id": "primary_location.source.id",
                "entityType": "works",
                "subjectEntity": "works",
                "displayName": "source",
                "entityId": "sources",
                "objectEntity": "sources",
                "type": "select",
                "newType": "entity",
                "category": "source",
                "actions": [
                    "filter",
                    "group_by",
                ],
                "icon": "mdi-book-open-outline",
                "extractFn": "(entity) => entity.primary_location.source",
            },

            // fourth column
            {
                "key": "publication_year",
                "id": "publication_year",
                "entityType": "works",
                "subjectEntity": "works",
                "displayName": "year",
                "isDate": true,
                "type": "range",
                "newType": "number",
                "sortByValue": true,
                "examples": ["1999", "1999-", "1999-2020"],
                "category": "other",
                "actions": ["filter", "sort", "column", "group_by"],
                "actionsPopular": ["filter", "sort", "column", "group_by"],
                "icon": "mdi-calendar-range",
                "extractFn": "(entity) => entity.publication_year",
            },

            // fifth column
            {
                "key": "authorships.author.id",
                "id": "authorships.author.id",
                "entityType": "works",
                "subjectEntity": "works",
                "displayName": "author",
                "entityId": "authors",
                "objectEntity": "authors",
                "type": "select",
                "newType": "entity",
                "category": "author",
                "actions": [
                    "filter",
                    "group_by",
                ],
                "actionsPopular": [
                    "filter",
                    "group_by",
                ],
                "icon": "mdi-account-outline",
                "extractFn": "(entity) => { return entity.authorships.map(authorship => { return authorship.author }) }",
            },
        ],
        summary: [
            // let's just ignore this for now, we'll add summaries later.
            null,
            null,
            null,
            null,
            null,
        ],
        body: [
            // first row
            [
                // first cell of first row. entity.
                // because it's newType=entity, we give an object with both the ID and display name.
                {
                    type: "entity",
                    value: {
                        "id": "https://openalex.org/W1775749144",
                        "display_name": "Journal of Biological Chemistry"
                    }
                },

                // second cell of first row. boolean.
                {
                    type: "boolean",
                    value: true,
                },

                // third cell of first row. entity.
                {
                    type: "entity",
                    value: {
                        "id": "https://openalex.org/S1234567890",
                        "display_name": "Journal of Biological Chemistry"
                    }
                },

                // fourth cell of first row. number.
                {
                    type: "number",
                    value: 1951,
                },

                // fifth cell of first row. list of entities.
                {
                    type: "entity",
                    isList: true,
                    value: [
                        {
                            id: "https://openalex.org/a5067833651",
                            display_name: "Oliver H. Lowry"
                        },
                        {
                            id: "https://openalex.org/a5032482932",
                            display_name: "Nira J. Rosebrough"
                        },
                        {
                            id: "https://openalex.org/a5004071084",
                            display_name: "A. Farr",
                        },
                        {
                            id: "https://openalex.org/a5074535928",
                            display_name: "ROSE J. RANDALL"
                        }
                    ]
                }
            ]

            // second row goes here, but I'm not going to write it out
            // [ ... ]
        ]
    }
}

export {
    ret1,
}