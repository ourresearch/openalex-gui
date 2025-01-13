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
    ]
}



export {
    getTestSuite,
    getTestQuery,
}