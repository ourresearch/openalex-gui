const urlBase = {
    api: "https://api.openalex.org",
    userApi: "https://user.openalex.org",
}

// Use port to change local API endpoints
// Example: npm run serve -- --port 8081
if (window.location.port && parseInt(window.location.port) === 8081) {
    urlBase.api = "http://localhost:5006"  // your locally-hosted API
    console.log("Setting API base URL to local machine (dev use only): " + urlBase.api)
} else if (window.location.port && parseInt(window.location.port) === 8082) {
    urlBase.api = "https://staging-jump-api.herokuapp.com"  // staging heroku API
    console.log("Setting API base URL to staging heroku (dev use only): " + urlBase.api)
} else if (window.location.port && parseInt(window.location.port) === 8083) {
    urlBase.userApi = "http://localhost:5106"  // your locally-hosted User API
    console.log("Setting User API base URL to local machine (dev use only): " + urlBase.userApi)
} 

const axiosConfig =  () => {
    const token = localStorage.getItem("token")
    const headers = {}
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }
    return {
        headers: headers
    }
}


export {
    urlBase,
    axiosConfig,
}