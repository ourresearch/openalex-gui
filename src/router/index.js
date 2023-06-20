import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Serp from "../views/Serp";
import About from "../views/About";
import store from "@/store";
import UserSignup from "@/components/user/UserSignup.vue";
import UserMagicToken from "../components/user/UserMagicToken.vue";

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
    { path: '/login/magic-token/:token', name: 'Magic-token', component: UserMagicToken},

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
    if (localStorage.getItem("token")) {
        console.log("in router, we found a user token")
        try {
            await store.dispatch("user/fetchUser")
        } catch (e) {
            store.commit("logout")
        }
    }

    if (to.matched.some(record => record.meta.requiresAuth)) {
        // this page requires authentication
        if (store.getters.isLoggedIn) {  // you're logged in great. proceed.
            // if route /admin
            if (to.matched.some(record => record.path === '/admin')) {
                // is logged in user email allowed to see /admin
                if (to.matched.some(record => store.getters.userEmail.endsWith(record.meta.domain))) {
                    // allowed to see admin dashboard
                    next()
                } else {
                    // not allowed, go back to user home page: /u
                    next("/u")
                }
            } else {
                // not /admin route
                next()
            }
        } else { // sorry, you can't view this page. go log in.
            next("/login")
        }
    } else { //  no auth required. proceed.
        next()
    }
});



export default router
