import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Faq from "../views/Faq.vue";
import Testimonials from "../views/Testimonials.vue";
import Help from "../views/Help.vue";
import OpenAlexStats from "../views/OpenAlexStats.vue";

import Serp from "../views/Serp";
import EntityPage from "@/views/EntityPage.vue";
import About from "../views/About";
import store from "@/store";
import UserSignup from "@/components/user/UserSignup.vue";
import UserMagicToken from "../components/user/UserMagicToken.vue";
import Login from "@/views/Login.vue";
import Me from "../views/Me.vue"

import goTo from 'vuetify/es5/services/goto'
import Webinars from "../views/Webinars.vue";
import OurStats from "../views/OurStats.vue";
import {entityTypeFromId, isOpenAlexId} from "@/util";
import PageNotFound from "@/views/PageNotFound.vue";
import Signup from "@/views/Signup.vue";
import SavedSearches from "@/views/SavedSearches.vue";
import {url} from "@/url";
import {getEntityConfigs} from "@/entityConfigs";


Vue.use(VueRouter)


// const entityNames = "works|authors|sources|publishers|funders|institutions|concepts"

const entityNames = getEntityConfigs().map(c => c.name).join("|")

const routes = [



    // data pages
    {
        path: `/:entityType(${entityNames})`,
        name: 'Serp',
        component: Serp,
    },

    {
        path: `/:entityId([waspfict]\\d+)`,
        name: 'EntityPageShortcut',
        redirect: to => {
            const entityType = entityTypeFromId(to.params.entityId)
            console.log("routes EntityPageShortcut", to.params)
            return {
                name: "EntityPage",
                params: {
                    entityType,
                    entityId: to.params.entityId,
                },
            }
        }
    },


    // user pages and routes
    {path: '/signup', name: 'Signup', component: Signup},
    {path: '/login', name: 'Login', component: Login},
    {path: '/me/searches', name: 'SavedSearches', component: SavedSearches, meta: {requiresAuth: true}},
    {path: '/login/magic-token/:token', name: 'Magic-token', component: UserMagicToken},
    {path: '/me', name: 'Me', component: Me, meta: {requiresAuth: true}},


    // static pages
    {
        path: '/',
        // redirect: {name: "Serp", params: {entityType: "works"}},
        component: Home,
        name: 'Home',
        // component: Home
    },
    {path: '/about', name: 'About', component: About},
    {path: '/faq', component: Faq},
    {path: '/users', redirect: {name: "testimonials"}},
    {path: '/testimonials', name: "testimonials", component: Testimonials},
    {path: '/stats', component: OurStats},


    // redirects to gitbook docs
    {
        path: '/data-dump', beforeEnter() {
            window.location.href = "https://docs.openalex.org/download-snapshot"
        }
    },
    {
        path: '/rest-api', beforeEnter() {
            window.location.href = "https://docs.openalex.org/how-to-use-the-api/api-overview"
        }
    },
    {
        path: '/schema', beforeEnter() {
            window.location.href = "https://docs.openalex.org/download-snapshot"
        }
    },
    {
        path: '/mag-migration-guide', beforeEnter() {
            window.location.href = "https://docs.openalex.org/download-snapshot/mag-format"
        }
    },

    {
        path: '/author-change-request', beforeEnter() {
            window.location.href = "https://docs.google.com/forms/d/e/1FAIpQLSel6otVekIyVOl46eh59mSkruIz32hAnGbJR6KM925E8wiCSg/viewform?usp=sf_link"
        }
    },
    {
        path: '/authorChangeRequest', beforeEnter() {
            window.location.href = "https://docs.google.com/forms/d/e/1FAIpQLSel6otVekIyVOl46eh59mSkruIz32hAnGbJR6KM925E8wiCSg/viewform?usp=sf_link"
        }
    },

    {
        path: '/webinars', beforeEnter() {
            window.location.href = "https://help.openalex.org/events/webinars"
        }
    },
    {
        path: '/open-houses', beforeEnter() {
            window.location.href = "https://help.openalex.org/events/open-houses"
        }
    },
    {
        path: '/user-meeting', beforeEnter() {
            window.location.href = "https://help.openalex.org/events/user-meeting"
        }
    },

    {
        path: '/pricing', beforeEnter() {
            window.location.href = "https://help.openalex.org/pricing"
        }
    },

    {
        path: '/help', beforeEnter() {
            window.location.href = "https://openalex.zendesk.com/hc/requests/new"
        }
    },
    {
        path: '/contact', beforeEnter() {
            window.location.href = "https://openalex.zendesk.com/hc/requests/new"
        }
    },
    {
        path: '/feedback', beforeEnter() {
            window.location.href = "https://openalex.zendesk.com/hc/requests/new"
        }
    },
    {
        path: '/support', beforeEnter() {
            window.location.href = "https://openalex.zendesk.com/hc/requests/new"
        }
    },
    {
        path: '/webinars/api-notebook-01', beforeEnter() {
            window.location.href = "https://github.com/ourresearch/openalex-api-tutorials/blob/main/notebooks/getting-started/api-webinar-apr2024/tutorial01.ipynb"
        }
    },

    {
        path: `/:entityType/:entityId`,
        name: 'EntityPage',
        component: EntityPage,
        // redirect: to => {
        //     return {
        //         name: "Serp",
        //         params: {entityType: "works"},
        //         query: {sidebar: to.params.entityId}
        //     }
        // }
    },

    {path: '*', component: PageNotFound},


]

const router = new VueRouter({
    routes,
    mode: "history",
    scrollBehavior: (to, from, savedPosition) => {
        if (to.hash) {
            return goTo(to.hash, {
                offset: 75,
            })
        } else if (savedPosition) {
            return savedPosition
        } else if (to.name === "Serp") {
            // do nothing
        } else {
            return {x: 0, y: 0}
        }
    },
})

const redirectFromOldFilters = function (to, from, next) {
    const redirects = {
        "institutions.country_code": "authorships.countries",
        "topics.id": "primary_topic.id",
    }
    const isRedirectNeeded = Object.keys(redirects).some(key => {
        return to.name === "Serp" && to.fullPath.includes(key)
    })
    if (isRedirectNeeded) {
        let newFullPath = to.fullPath
        Object.keys(redirects).forEach(k => {
            newFullPath = newFullPath.replaceAll(k, redirects[k])
        })
        return next(newFullPath)
    }
}


router.beforeEach(async (to, from, next) => {
    if (localStorage.getItem("token") && !store.getters["user/userId"]) {
        try {
            await store.dispatch("user/fetchUser")
        } catch (e) {
            store.commit("user/logout")
        }
    }

    redirectFromOldFilters(to, from, next)

    if (to.matched.some(record => record.meta.requiresAuth)) {
        // this page requires authentication
        if (store.getters["user/userId"]) {  // you're logged in great. proceed.
            next()
        } else { // sorry, you can't view this page. go log in.
            next("/login")
        }
    } else { //  no auth required. proceed.
        next()
    }
});


export default router
