import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Serp from "../views/Serp";
import About from "../views/About";

import goTo from 'vuetify/es5/services/goto'


Vue.use(VueRouter)


const openAlexIdRegex = "[wWiIvVsSaPpFfAcC]\\d+" // double-backslash to escape it: https://router.vuejs.org/guide/essentials/route-matching-syntax.html#custom-regex-in-params



const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: `/:entityType(works|authors|sources|publishers|funders|institutions|concepts)`,
        name: 'Serp',
        component: Serp,
        children: [
            // {
            //     path: `:id(${openAlexIdRegex})`,
            //     name: "entity-zoom",
            //     component: ZoomEntity
            // },
            // {
            //     path: "filters",
            //     name: "filter-types",
            //     component: ZoomFilter,
            //     children: [
            //         {
            //             path: ":filterTypeKey",
            //             name: "filter",
            //
            //         }
            //     ]
            // }
        ]
    },
    { path: '/about', name: 'About', component: About}
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
