import axios from "axios";
import YAML from "yaml";

const getTestSuite = async function (testSuiteId) {
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

export {
    getTestSuite,
    getTestQuery,
}