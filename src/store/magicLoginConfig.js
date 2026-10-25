// Request config for POST /users/magic-login (oxjob #1762).
//
// It carries the signed-in account's own key, and never the admin
// impersonation header: an org invitation sent to an address this account
// added but never verified joins this account only when the click comes signed
// in to it. Signed out, it is an empty config, as before.
export function magicLoginConfig() {
    let token = null
    try {
        token = localStorage.getItem("token")
    } catch (e) {
        // no storage (private mode, SSR): signed out
    }
    return token ? {headers: {Authorization: `Bearer ${token}`}} : {}
}
