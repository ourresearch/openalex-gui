import axios from 'axios'


let urlBase = "https://api.openalex.org"
// let urlBase = "https://openalex-guts.herokuapp.com"
// let urlBase = "https://unpaywall-jump-api-dev.herokuapp.com/"


// this lets you develop against a local API endpoint
// to set the port, when you start your dev server, use: npm run serve -- --port <my port num>
// example:
// npm run serve -- --port 8081
if (window.location.port && parseInt(window.location.port) === 8081) {
    urlBase = "http://localhost:5004/"  // your locally-hosted API
    console.log("Setting API base URL to local machine (dev use only): " + urlBase)
}
else if (window.location.port && parseInt(window.location.port) === 8082) {
    urlBase = "https://staging-jump-api.herokuapp.com/"  // staging heroku url
    console.log("Setting API base URL to staging heroku (dev use only): " + urlBase)
}


const getConfig = function () {
    const token = localStorage.getItem("token")
    const headers = {}
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }
    return {
        headers: headers
    }
}


const api = (function () {
    return {
        get: async function (path) {
            console.log("api GET:", path)
            let url = urlBase + path + "?mailto=team@ourresearch.org"
            let res
            try {
                res = await axios.get(url)
                console.log(`api GET ${path} success:`, res.data)
            } catch (e) {
                // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
                console.log("api GET failure:", e.response)
                throw e
            }
            return res.data
        },
    }
})()



export {
    urlBase,
    api,
}