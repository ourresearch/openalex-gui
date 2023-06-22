import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Serp from "../views/Serp";
import About from "../views/About";
import store from "@/store";
import UserSignup from "@/components/user/UserSignup.vue";
import UserMagicToken from "../components/user/UserMagicToken.vue";
import Login from "@/views/Login.vue";
import Me from "../views/Me.vue"

import goTo from 'vuetify/es5/services/goto'


Vue.use(VueRouter)





const routes = [
    {
        path: '/',
        redirect: {name: "Serp", params: {entityType: "works"}},
        name: 'Home',
        // component: Home
    },
    {
        path: `/:entityType(works|authors|sources|publishers|funders|institutions|concepts)`,
        name: 'Serp',
        component: Serp,
    },
    { path: '/about', name: 'About', component: About},
    { path: '/signup', name: 'Signup', component: UserSignup},
    { path: '/login', name: 'Login', component: Login},
    { path: '/login/magic-token/:token', name: 'Magic-token', component: UserMagicToken},
    { path: '/me',redirect: {name: "Me", params: {tab: "details"}}},
    { path: '/me/:tab?', name: 'Me', component: Me, meta: {requiresAuth: true}},

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
        console.log("in router, we found a user token")
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
