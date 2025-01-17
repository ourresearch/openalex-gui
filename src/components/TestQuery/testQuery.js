import axios from "axios";
import YAML from "yaml";

const getTestSuite = async function (testSuiteId) {
    if (testSuiteId in localTestSuites) {
        return localTestSuites[testSuiteId].map((testConfig, i) =>  ({...testConfig, id: i}) )
    }

    const url = `https://raw.githubusercontent.com/ourresearch/oqo-search-tests/main/${testSuiteId}.yaml`
    const resp = await axios.get(url)
    const ret = YAML.parse(resp.data).map((testConfig, i) => {
        return {
            ...testConfig,
            id: i,
        }
    })
    return ret
}
const getTestQuery = async function (testSuiteId, queryId) {
    const testSuite = await getTestSuite(testSuiteId)
    return testSuite.find(test => test.id == queryId)
}


const localTestSuites = {
    disjunctions: [
        // WORKS
        {
            title: "One work ID",
            oql: "get works where id is works/W1775749144;",
            query: {
                get_rows: "works",
                filter_works: [                
                    {
                        column_id: "id",
                        value: "works/W1775749144"
                    },
                            
                ]
            }
        },
        {
            title: "Two work IDs, or",
            oql: "get works where (id is works/W1775749144 or id is works/W2582743722);",
            query: {
                get_rows: "works",
                filter_works: [
                    {
                        join: "or",
                        filters: [
                            {
                                column_id: "id",
                                value: "works/W1775749144"
                            },
                            {
                                column_id: "id",
                                value: "works/W2582743722"
                            }
                        ]
                    },
                ],
            }
        },
        {
            title: "Two work IDs, and",
            expectsZeroResults: true,
            oql: "get works where (id is works/W1775749144 and id is works/W2582743722);",
            query: {
                get_rows: "works",
                filter_works: [
                    {
                        join: "and",
                        filters: [
                            {
                                column_id: "id",
                                value: "works/W1775749144"
                            },
                            {
                                column_id: "id",
                                value: "works/W2582743722"
                            }
                        ]
                    },
                ],
            }
        },
        {
            title: "Intersecting work IDs, and/or+or",
            oql: "get works where ((id is works/W1775749144 or id is works/W2582743722) and (id is works/W1775749144 or id is works/W2100837269));",
            query: {
                get_rows: "works",
                filter_works: [
                    {join: "and",
                        filters: [
                            {join: "or",
                                filters: [
                                    {column_id: "id",
                                     value: "works/W1775749144"
                                    },
                                    {column_id: "id",
                                     value: "works/W2582743722"
                                    }
                                ]
                            },
                            {join: "or",
                                filters: [
                                    {column_id: "id",
                                     value: "works/W1775749144"
                                    },
                                    {column_id: "id",
                                     value: "works/W2100837269"
                                    }
                                ]
                            }
                        ]
                    },
                ],
            }
        },
        {
            title: "Works: letters, editorial, or erratum ",
            expectsZeroResults: true,
            oql: "get works where (type is types/letter or type is types/editorial or type is types/erratum);",
            query: {
                get_rows: "works",
                filter_works: [
                    {
                        join: "or",
                        filters: [
                            {
                                column_id: "type",
                                value: "types/letter"
                            },
                            {
                                column_id: "type",
                                value: "types/editorial"
                            },
                            {
                                column_id: "type",
                                value: "types/erratum"
                            },
                        ]
                    },
                ],
            }
        },
        // AUTHORS
        {
            title: "One author ID",
            oql: "get authors where id is authors/A5066175077;",
            query: {
                get_rows: "authors",
                filter_aggs: [                
                    {
                        column_id: "id",
                        value: "authors/A5066175077"
                    },
                            
                ]
            }
        },
        {
            title: "Two author IDs, or",
            oql: "get authors where (id is authors/A5066175077 or id is authors/A5011180999);",
            query: {
                get_rows: "authors",
                filter_aggs: [
                    {
                        join: "or",
                        filters: [
                            {
                                column_id: "id",
                                value: "authors/A5066175077"
                            },
                            {
                                column_id: "id",
                                value: "authors/A5011180999"
                            }
                        ]
                    },
                ],
            }
        },
        {
            title: "Two author IDs, and",
            expectsZeroResults: true,
            oql: "get authors where (id is authors/A5066175077 and id is authors/A5011180999);",
            query: {
                get_rows: "authors",
                filter_aggs: [
                    {
                        join: "and",
                        filters: [
                            {
                                column_id: "id",
                                value: "authors/A5066175077"
                            },
                            {
                                column_id: "id",
                                value: "authors/A5011180999"
                            }
                        ]
                    },
                ],
            }
        },
    ],
    labels: [ 
        {
            title: "Works with Label of Authors",
            oql: "get works where authorships.author.id matches any item in label col-eRqykNqf5oHnd4RxrwVGdL;",
            query: {
                get_rows: "works",
                filter_works: [                
                    {
                        column_id: "authorships.author.id",
                        operator: "matches any item in label",
                        value: "col-eRqykNqf5oHnd4RxrwVGdL"
                    },
                            
                ]
            }
        },
        {
            title: "Authors with Label of Authors",
            oql: "get authors where id matches any item in label col-eRqykNqf5oHnd4RxrwVGdL;",
            query: {
                get_rows: "authors",
                filter_aggs: [                
                    {
                        column_id: "id",
                        operator: "matches any item in label",
                        value: "col-eRqykNqf5oHnd4RxrwVGdL"
                    },
                            
                ]
            }
        },
    ]
}



export {
    getTestSuite,
    getTestQuery,
}