// Send bypass_cache params on API calls
const DISABLE_SERVER_CACHE = true;

const urlBase = {
    api: "https://api.openalex.org",
    userApi: "https://user.openalex.org",
    exportApi: "https://export.openalex.org",
};

// Use port to change local API endpoints
// Example: npm run serve -- --port 8081

// 8081: Local Elastic API
if (window.location.port && parseInt(window.location.port) === 8081) {
    urlBase.api = "http://localhost:5006";
    console.log("Setting API base URL to local machine (dev use only): " + urlBase.api);

// 8082: Staging Elastic API
} else if (window.location.port && parseInt(window.location.port) === 8082) {
    urlBase.api = "https://staging-jump-api.herokuapp.com";
    console.log("Setting API base URL to staging heroku (dev use only): " + urlBase.api);

// 8083: Local User API
} else if (window.location.port && parseInt(window.location.port) === 8083) {
    urlBase.userApi = "http://localhost:5106";
    console.log("Setting User API base URL to local machine (dev use only): " + urlBase.userApi);

// 8084: Local Elastic & User API
} else if (window.location.port && parseInt(window.location.port) === 8084) {
    urlBase.api = "http://localhost:5006";
    console.log("Setting API base URL to local machine (dev use only): " + urlBase.api);
    urlBase.userApi = "http://localhost:5106";
    console.log("Setting User API base URL to local machine (dev use only): " + urlBase.userApi);

// 8085: Local Export API
} else if (window.location.port && parseInt(window.location.port) === 8085) {
    urlBase.exportApi = "http://localhost:5006";
    console.log("Setting Export API base URL to local machine (dev use only): " + urlBase.exportApi);
} 

const axiosConfig =  (options={}) => {
    const headers = {}
    if (options.userAuth) {
        const token = localStorage.getItem("token");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    } else {
        headers.Authorization = "Bearer YWMKSvdNwfrknsOPtdqCPz";
    }

    if (options.noCache) {
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        headers["Pragma"] = "no-cache";
    }
    return {
        headers: headers
    };
}

export {
    urlBase,
    axiosConfig,
    DISABLE_SERVER_CACHE,
};