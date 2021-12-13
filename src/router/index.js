import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import EntityPage from "../views/EntityPage";
import Accessibility from "../views/Accessibility";
import Transparency from "../views/Transparency";
import goTo from 'vuetify/es5/services/goto'

Vue.use(VueRouter)

const entityTypes = {
    "W": "works",
    "I": "institutions",
    "V": "venues",
    "A": "authors",
    "C": "concepts",
};

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },

    {
        path: '/:id([wWiIvVaAcC]\\d+)',
        redirect: to => {
            // https://router.vuejs.org/api/#the-route-object
            const firstLetter = to.params.id.substr(0,1).toUpperCase()
            const entityType = entityTypes[firstLetter]
            return `/${entityType}/${to.params.id}`
        },
    },


    {
        path: '/:entityType(works|authors|venues|institutions|concepts)/:id',
        name: 'EntityPage',
        component: EntityPage,
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
        if (to.hash) {
            return goTo(to.hash, {
                offset: 75,
            })
        } else if (savedPosition) {
            return savedPosition
        } else {
            return {x: 0, y: 0}
        }

    },
})


export default router
