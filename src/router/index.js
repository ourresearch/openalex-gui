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
import Pricing from "../views/Pricing.vue";
import Webinars from "../views/Webinars.vue";
import OurStats from "../views/OurStats.vue";
import {isOpenAlexId} from "@/util";
import PageNotFound from "@/views/PageNotFound.vue";


Vue.use(VueRouter)



const entityNames = "works|authors|sources|publishers|funders|institutions|concepts"
const routes = [

    // data pages
    {
        path: `/:entityType(${entityNames})`,
        name: 'Serp',
        component: Serp,
    },
    {
        path: `/:entityType(${entityNames})/:entityId`,
        redirect: to => {
            return {
                name: "Serp",
                params: {entityType: "works"},
                query: {sidebar: to.params.entityId}
            }
        }
    },
    {
        path: `/:entityId([waspfic]\\d+)`,
        redirect: to => {
            return {
                name: "Serp",
                params: {entityType: "works"},
                query: {sidebar: to.params.entityId}
            }
        }
    },


    // user pages and routes
    { path: '/signup', name: 'Signup', component: UserSignup},
    { path: '/login', name: 'Login', component: Login},
    { path: '/login/magic-token/:token', name: 'Magic-token', component: UserMagicToken},
    { path: '/me',redirect: {name: "Me", params: {tab: "details"}}},
    { path: '/me/:tab?', name: 'Me', component: Me, meta: {requiresAuth: true}},


    // static pages
    {
        path: '/',
        // redirect: {name: "Serp", params: {entityType: "works"}},
        component: Home,
        name: 'Home',
        // component: Home
    },
    { path: '/about', name: 'About', component: About},
    {path: '/faq', component: Faq},
    {path: '/users', redirect: {name: "testimonials"}},
    {path: '/testimonials', name: "testimonials", component: Testimonials},
    {path: '/help', component: Help},
    {path: '/feedback', component: Help},
    {path: '/contact', redirect: {name: "about"}},
    {path: '/pricing', component: Pricing},
    {path: '/webinars', component: Webinars},
    // {path: '/stats', component: OpenAlexStats},
    {path: '/stats', component: OurStats},


    // redirects to gitbook docs
    {path: '/data-dump', beforeEnter() {window.location.href = "https://docs.openalex.org/download-snapshot" }},
    {path: '/rest-api', beforeEnter() {window.location.href = "https://docs.openalex.org/api" }},
    {path: '/schema', beforeEnter() {window.location.href = "https://docs.openalex.org/download-snapshot" }},
    {path: '/mag-migration-guide', beforeEnter() {window.location.href = "https://docs.openalex.org/download-snapshot/mag-format" }},

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
        }
        else if (to.name === "Serp") {
            // do nothing
        }
        else {
            return {x: 0, y: 0}
        }

    },
})

router.beforeEach(async (to, from, next) => {
    const userId = store.getters["user/userId"]

    if (localStorage.getItem("token") && !userId) {
        try {
            await store.dispatch("user/fetchUser")
        } catch (e) {
            store.commit("logout")
        }
    }

    if (to.matched.some(record => record.meta.requiresAuth)) {
        // this page requires authentication
        if (userId) {  // you're logged in great. proceed.
            next()
        } else { // sorry, you can't view this page. go log in.
            next("/login")
        }
    } else { //  no auth required. proceed.
        next()
    }
});



export default router
