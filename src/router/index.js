import { createRouter, createWebHistory } from 'vue-router';

import store from '@/store';
import {getEntityConfigs} from "@/entityConfigs";
import {entityTypeFromId} from "@/util";

import HomePage from '@/views/Home.vue'
import SerpPage from '@/views/Serp.vue';
import ResultsPage from '@/views/Results.vue';
import EntityPage from '@/views/EntityPage.vue';
import AnalyticsHome from '@/components/Home/AnalyticsHome.vue'
import AnalyticsDocs from '@/views/AnalyticsDocs.vue';
import AnalyticsTesting from '@/views/AnalyticsTesting.vue';

import LoginPage from '@/views/Login.vue';
import SignupPage from "@/views/Signup.vue";
import ResetPassword from "@/views/ResetPassword.vue";
import UserMagicToken from '@/components/User/UserMagicToken.vue';

import AboutPage from '@/views/About.vue';
import OurStats from '@/views/OurStats.vue';
import TestimonialsPage from "@/views/Testimonials.vue";
import WorksCitingOpenAlex from "@/views/WorksCitingOpenAlex.vue";

import MeBase from "@/views/Me/MeBase.vue";
import MeAbout from "@/views/Me/MeAbout.vue";
import MeSearches from "@/views/Me/MeSearches.vue";
import MeLabels from "@/views/Me/MeLabels.vue";
import MeCorrections from "@/views/Me/MeCorrections.vue";
import LabelDetails from "@/components/Label/LabelDetails.vue";

import PageNotFound from "@/views/PageNotFound.vue";
import AdminPage from "@/views/AdminPage.vue";

import TestQueriesBase from "@/views/TestQueries/TestQueriesBase.vue";
import TestQueriesSuite from "@/views/TestQueries/TestQueriesSuite.vue";
import TestQueryView from "@/views/TestQueries/TestQueryView.vue";
import TestQueriesTest from "@/views/TestQueries/TestQueriesTest.vue";
import TestQueriesSuitesList from "@/views/TestQueries/TestQueriesSuitesList.vue";


// TOOD Check if these are equal
//const entityNames = Object.keys(getConfigs()).join("|");
const entityNames = getEntityConfigs().map(c => c.name).join("|")

const redirect = (path, url) => ({path, beforeEnter() { window.location.href = url }});

const routes = [
    {
        path: '/',
        component: HomePage,
        name: 'Home',
    },
    {
        path: '/analytics',
        component: AnalyticsHome,
        name: 'AnalyticsHome',
    },
    // data pages
    {
        path: "/s/:id?",
        name: "search",
        meta: {requiresAuth: true},
        component: ResultsPage,
    },
    {
        path: `/:entityType(${entityNames})`,
        name: 'Serp',
        component: SerpPage,
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
    {
        path: `/:entityType(${entityNames})/:entityId`,
        name: 'EntityPage',
        component: EntityPage,
    },

    // user pages and routes
    {path: '/signup', name: 'Signup', component: SignupPage},
    {path: '/login', name: 'Login', component: LoginPage},
    {path: '/reset-password', name: 'ResetPassword', component: ResetPassword},
    {path: '/login/magic-token/:token', name: 'Magic-token', component: UserMagicToken},

    // Acounts Pages
    {
        path: '/me',
        component: MeBase,
        meta: {requiresAuth: true},
        children: [
            {
                path: '',
                name: 'me-home',
                component: MeAbout,
            },
            {
                path: '/me/about',
                name: 'me-about',
                component: MeAbout,
            },
            {
                path: '/me/searches',
                name: 'SavedSearches',
                component: MeSearches,
            },
            {
                path: '/me/labels',
                name: 'me-labels',
                component: MeLabels,
                children: [
                    {
                        path: '/me/labels/:labelId',
                        component: LabelDetails,
                    }
                ]
            },
            {
                path: '/me/corrections',
                name: 'me-corrections',
                component: MeCorrections,
            },
        ]
    },

    // static pages
    {path: '/about', name: 'About', component: AboutPage},
    {path: '/users', redirect: {name: "testimonials"}},
    {path: '/testimonials', name: "testimonials", component: TestimonialsPage},
    {path: '/works-citing-openalex', name: "works-citing-openalex", component: WorksCitingOpenAlex},
    {path: '/stats', component: OurStats},
    {path: '/analytics/docs', name: 'AnalyticsDocs', component: AnalyticsDocs},
    {path: '/analytics/testing', name: 'AnalyticsTesting', component: AnalyticsTesting},
    
    //  admin
    {
        path: '/admin',
        name: 'admin',
        component: AdminPage,
        meta: { requiresAuth: true }
    },
   
    //  tests
    {
        path: '/tests',
        component: TestQueriesBase,
        children: [
            {
                path: '',
                name: 'test-suites-list',
                component: TestQueriesSuitesList,
            },
            {
                path: '/tests/:testSuiteId',
                name: 'test-queries-suite',
                component: TestQueriesSuite,
            },
            {
                path: '/tests/:testSuiteId/:queryId',
                name: 'test-query',
                component: TestQueryView,
            },
            {
                path: '/tests/:testSuiteId/:queryId/:testType/:testId',
                name: 'test',
                component: TestQueriesTest,
            },
        ]
    },

    // Docs
    redirect('/data-dump', "https://docs.openalex.org/download-snapshot"),
    redirect('/rest-api', "https://docs.openalex.org/how-to-use-the-api/api-overview"),
    redirect('/schema', "https://docs.openalex.org/download-snapshot"),
    redirect('/mag-migration-guide', "https://docs.openalex.org/download-snapshot/mag-format"),
    
    // Forms
    redirect('/author-change-request', "https://docs.google.com/forms/d/e/1FAIpQLSel6otVekIyVOl46eh59mSkruIz32hAnGbJR6KM925E8wiCSg/viewform?usp=sf_link"),
    redirect('/authorChangeRequest', "https://docs.google.com/forms/d/e/1FAIpQLSel6otVekIyVOl46eh59mSkruIz32hAnGbJR6KM925E8wiCSg/viewform?usp=sf_link"),
    
    // Help center
    redirect('/webinars', "https://help.openalex.org/hc/en-us/articles/24428492324631-Webinars"),
    redirect('/open-houses', "https://help.openalex.org/hc/en-us/articles/24428530346263-Open-houses"),
    redirect('/user-meeting', "https://help.openalex.org/events/user-meeting"),
    redirect('/pricing', "https://help.openalex.org/pricing"),
    
    // Support
    redirect('/help', "https://help.openalex.org"),
    redirect('/contact', "https://openalex.zendesk.com/hc/requests/new"),
    redirect('/feedback', "https://openalex.zendesk.com/hc/requests/new"),
    redirect('/support', "https://openalex.zendesk.com/hc/requests/new"),
    
    // Resources
    redirect('/webinars/api-notebook-01', "https://github.com/ourresearch/openalex-api-tutorials/blob/main/notebooks/getting-started/api-webinar-apr2024/tutorial01.ipynb"),
    
    {path: '/:pathMatch(.*)*', name: "PageNotFound", component: PageNotFound},
];


const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) {
            return {
                el: to.hash,
                top: 75
            };
        } else if (savedPosition) {
            return savedPosition;
        } else if (to.name === "Serp") {
            // do nothing
            return false;
        } else {
            return {left: 0, top: 0};
        }
    },
});

const redirectFromOldFilters = function (to, from, next) {
    const redirects = {
        // "institutions.country_code": "authorships.countries",
        // "topics.id": "primary_topic.id",
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


    // Enforce authentication for protected routes
    if (to.matched.some(record => record.meta.requiresAuth) && !store.getters["user/userId"]) {
        return next({
            name: 'Login',
            query: { redirect: to.fullPath }
        });
    }
    next();
});

export default router;