import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Serp from "../views/Serp";
import Accessibility from "../views/Accessibility";
import Transparency from "../views/Transparency";
import goTo from 'vuetify/es5/services/goto'
import {entityTypeFromId} from "../util";

Vue.use(VueRouter)


const openAlexIdRegex = "[wWiIvVaAcC]\\d+" // double-backslash to escape it: https://router.vuejs.org/guide/essentials/route-matching-syntax.html#custom-regex-in-params

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },

    // temp for now
    // {
    //     path: '/',
    //     redirect: 'works/W2741809807',
    // },

    // explore.openalex.org/w123
    {
        path: `/:id(${openAlexIdRegex})`,
        redirect: to => {
            // https://router.vuejs.org/api/#the-route-object
            const entityType = entityTypeFromId(to.params.id)
            return `/${entityType}?zoom=${to.params.id}`
        },
    },


    // explore.openalex.org/works/w123
    // {
    //     path: '/:entityType(works|authors|venues|institutions|concepts)/:id',
    //     name: 'EntityPage',
    //     component: EntityPage,
    // },

    // explore.openalex/works?filters=foo:42
    {
        path: `/:entityType(works|authors|venues|institutions|concepts)/:id(${openAlexIdRegex})?`,
        // path: `/:entityType(works|authors|venues|institutions|concepts)`,
        name: 'Serp',
        component: Serp,
    },
    {
        // path: `/:entityType(works|authors|venues|institutions|concepts)/:id(${openAlexIdRegex})?`,
        path: `/:entityType(works|authors|venues|institutions|concepts)`,
        name: 'Serp',
        component: Serp,
    },
    {path: '/team', redirect: "/about"},
    {path: '/accessibility', component: Accessibility},
    {path: '/transparency', component: Transparency},
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    }
]

const router = new VueRouter({
    routes,
    mode: "history",
    scrollBehavior: (to, from, savedPosition) => {
        console.log("router.scrollBehavior", from)

        if (to.hash) {
            return goTo(to.hash, {
                offset: 75,
            })
        } else if (savedPosition) {
            return savedPosition
        }
        else if (to.name === "Serp") {
            // do nothing
        }
        else {
            return {x: 0, y: 0}
        }

    },
})


export default router
