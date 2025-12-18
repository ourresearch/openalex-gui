// Send bypass_cache params on API calls
const DISABLE_SERVER_CACHE = false;

// Lazy store import to avoid circular dependency
let _store = null;
const getStore = () => {
    if (!_store) {
        _store = require('@/store').default;
    }
    return _store;
};

const urlBase = {
    api: "https://api.openalex.org",
    userApi: "https://user.openalex.org",
    correctionsApi: "https://corrections.openalex.org",
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

// 8085: Local Corrections API
} else if (window.location.port && parseInt(window.location.port) === 8085) {
    urlBase.correctionsApi = "http://localhost:5006";
    console.log("Setting Corrections API base URL to local machine (dev use only): " + urlBase.correctionsApi);
}

const axiosConfig = (options={}) => {

    const headers = {}
    if (options.userAuth) {
        // For user API calls, use JWT token
        const token = localStorage.getItem("token");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    } else {
        // For OpenAlex API calls, use logged-in user's API key if available
        // No default API key - unauthenticated calls use mailto only
        try {
            const store = getStore();
            const userApiKey = store?.state?.user?.apiKey;
            if (userApiKey) {
                headers.Authorization = `Bearer ${userApiKey}`;
            }
        } catch (e) {
            // Store not yet initialized, no API key header
        }
    }

    if (options.noCache) {
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
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