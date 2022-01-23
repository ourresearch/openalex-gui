import axios from 'axios'
import {makeUrl} from "./urls";


// const getConfig = function () {
//     const token = localStorage.getItem("token")
//     const headers = {}
//     if (token) {
//         headers.Authorization = `Bearer ${token}`
//     }
//     return {
//         headers: headers
//     }
// }


const api = (function () {
    return {
        get: async function (pathName, searchParams) {
            console.log("api GET:", pathName, searchParams)
            if (pathName.indexOf("/") !== 0) {
                pathName = "/" + pathName
            }

            const url = makeUrl(pathName, searchParams, "api")

            let res
            try {
                res = await axios.get(url)
                console.log(`api GET ${url} success:`, res.data)
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
    api,
}