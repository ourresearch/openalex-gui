import { createRouter, createWebHistory } from 'vue-router';

import store from '@/store';
import {getEntityConfigs} from "@/entityConfigs";
import {entityTypeFromId} from "@/util";

import HomePage from '@/views/Home.vue'
import SerpPage from '@/views/Serp.vue';
import ResultsPage from '@/views/ResultsPage.vue';
import EntityPage from '@/views/EntityPage.vue';
import AnalyticsHome from '@/components/Home/AnalyticsHome.vue'
import AnalyticsDocs from '@/views/AnalyticsDocs.vue';
import AnalyticsTesting from '@/views/AnalyticsTesting.vue';

import LoginPage from '@/views/Login.vue';
import SignupPage from "@/views/Signup.vue";
import UserMagicToken from '@/components/User/UserMagicToken.vue';

import AboutPage from '@/views/About.vue';
import OurStats from '@/views/OurStats.vue';
import TestimonialsPage from "@/views/Testimonials.vue";
import WorksCitingOpenAlex from "@/views/WorksCitingOpenAlex.vue";
import TeamPage from "@/views/Team.vue";
import TransparencyPage from "@/views/Transparency.vue";
import LegalPage from "@/views/Legal.vue";
import PricingPage from '@/views/PricingPage.vue';

import MeAbout from "@/views/Me/MeProfile.vue";
import MeApi from "@/views/Me/MeApi.vue";
import MeSearches from "@/views/Me/MeSearches.vue";
import MeExports from "@/views/Me/MeExports.vue";
import MeEdits from "@/views/Me/MeEdits.vue";
import MeTags from "@/views/Me/MeTags.vue";
import MePlan from "@/views/Me/MePlan.vue";

import SettingsBase from "@/views/Settings/SettingsBase.vue";
import SettingsOrgProfile from "@/views/Settings/SettingsOrgProfile.vue";
import SettingsOrgPlan from "@/views/Settings/SettingsOrgPlan.vue";
import SettingsOrgApi from "@/views/Settings/SettingsOrgApi.vue";
import SettingsOrgMembers from "@/views/Settings/SettingsOrgMembers.vue";

import PageNotFound from "@/views/PageNotFound.vue";
import AdminBase from "@/views/Admin/AdminBase.vue";
import AdminUsers from "@/views/Admin/AdminUsers.vue";
import AdminExports from "@/views/Admin/AdminExports.vue";
import AdminEdits from "@/views/Admin/AdminEdits.vue";
import AdminUserDetail from "@/views/Admin/AdminUserDetail.vue";
import AdminOrganizations from "@/views/Admin/AdminOrganizations.vue";
import AdminOrganizationDetail from "@/views/Admin/AdminOrganizationDetail.vue";
import AdminOrganizationMembers from "@/views/Admin/AdminOrganizationMembers.vue";
import AdminScripts from "@/views/Admin/AdminScripts.vue";
import AdminPlans from "@/views/Admin/AdminPlans.vue";

import TestQueriesBase from "@/views/TestQueries/TestQueriesBase.vue";
import TestQueriesSuite from "@/views/TestQueries/TestQueriesSuite.vue";
import TestQueryView from "@/views/TestQueries/TestQueryView.vue";
import TestQueriesTest from "@/views/TestQueries/TestQueriesTest.vue";
import TestQueriesSuitesList from "@/views/TestQueries/TestQueriesSuitesList.vue";


// TOOD Check if these are equal
//const entityNames = Object.keys(getConfigs()).join("|");
const entityNames = getEntityConfigs()
    .filter(c => c.hasSerp !== false) // Exclude entities without SERP pages (like locations)
    .map(c => c.name)
    .join("|")

const redirect = (path, url) => ({
    path,
    name: `redirect-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
    component: {
        created() {
            window.location.href = url;
        },
        template: '<div>Redirecting...</div>'
    }
});

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
        path: '/locations/:entityId(.*)',
        name: 'LocationPage',
        component: EntityPage,
        beforeEnter: (to, from, next) => {
            to.params.entityType = 'locations';
            next();
        }
    },
    {
        path: `/:entityId([waspfictg]\\d+)`,
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
    {path: '/login/magic-token/:token', name: 'Magic-token', component: UserMagicToken},
    // Legacy route - redirect old password reset links to login
    {path: '/reset-password', redirect: { name: 'Login' }},

    // Account Pages - redirect old /me routes to /settings
    {
        path: '/me',
        redirect: '/settings/profile',
    },
    {
        path: '/me/about',
        redirect: '/settings/profile',
    },
    {
        path: '/me/api',
        redirect: '/settings/api',
    },
    {
        path: '/me/searches',
        redirect: '/settings/searches',
    },
    {
        path: '/me/exports',
        redirect: '/settings/exports',
    },
    {
        path: '/me/edits',
        redirect: '/settings/edits',
    },
    {
        path: '/me/tags',
        redirect: '/settings/tags',
    },
    {
        path: '/me/organization',
        redirect: '/settings/org-profile',
    },
    {
        path: '/me/plan',
        redirect: '/settings/plan',
    },

    // Unified Settings Pages
    {
        path: '/settings',
        component: SettingsBase,
        meta: {requiresAuth: true},
        children: [
            {
                path: '',
                name: 'settings-home',
                redirect: '/settings/profile',
            },
            {
                path: 'profile',
                name: 'settings-profile',
                component: MeAbout,
            },
            {
                path: 'plan',
                name: 'settings-plan',
                component: MePlan,
            },
            {
                path: 'api',
                name: 'settings-api',
                component: MeApi,
            },
            {
                path: 'searches',
                name: 'settings-searches',
                component: MeSearches,
            },
            {
                path: 'exports',
                name: 'settings-exports',
                component: MeExports,
            },
            {
                path: 'edits',
                name: 'settings-edits',
                component: MeEdits,
            },
            {
                path: 'tags',
                name: 'settings-tags',
                component: MeTags,
            },
            {
                path: 'org-profile',
                name: 'settings-org-profile',
                component: SettingsOrgProfile,
            },
            {
                path: 'org-plan',
                name: 'settings-org-plan',
                component: SettingsOrgPlan,
            },
            {
                path: 'org-api',
                name: 'settings-org-api',
                component: SettingsOrgApi,
            },
            {
                path: 'org-members',
                name: 'settings-org-members',
                component: SettingsOrgMembers,
            },
        ]
    },

    // static pages
    {path: '/about', name: 'About', component: AboutPage},
    {path: '/team', name: 'Team', component: TeamPage},
    {path: '/transparency', name: 'Transparency', component: TransparencyPage},
    {path: '/legal', name: 'Legal', component: LegalPage},
    {path: '/dev/pricing', name: 'Pricing', component: PricingPage},
    {path: '/policies', redirect: {name: "Legal"}},
    {path: '/accessibility', redirect: {name: "Legal"}},
    {path: '/users', redirect: {name: "testimonials"}},
    {path: '/testimonials', name: "testimonials", component: TestimonialsPage},
    {path: '/works-citing-openalex', name: "works-citing-openalex", component: WorksCitingOpenAlex},
    {path: '/data-map', name: "data-map", component: () => import('@/views/DataMap.vue')},
    {path: '/stats', component: OurStats},
    {path: '/analytics/docs', name: 'AnalyticsDocs', component: AnalyticsDocs},
    {path: '/analytics/testing', name: 'AnalyticsTesting', component: AnalyticsTesting},
    
    // Admin Pages
    {
        path: '/admin',
        component: AdminBase,
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
            {
                path: '',
                name: 'admin-home',
                redirect: '/admin/users',
            },
            {
                path: 'users',
                name: 'admin-users',
                component: AdminUsers,
            },
            {
                path: 'users/:userId',
                name: 'admin-user-detail',
                component: AdminUserDetail,
                props: true,
            },
            {
                path: 'organizations',
                name: 'admin-organizations',
                component: AdminOrganizations,
            },
            {
                path: 'organizations/:orgId',
                name: 'admin-organization-detail',
                component: AdminOrganizationDetail,
                props: true,
            },
            {
                path: 'organizations/:orgId/members',
                name: 'admin-organization-members',
                component: AdminOrganizationMembers,
                props: true,
            },
            {
                path: 'exports',
                name: 'admin-exports',
                component: AdminExports,
            },
            {
                path: 'edits',
                name: 'admin-edits',
                component: AdminEdits,
            },
            {
                path: 'scripts',
                name: 'admin-scripts',
                component: AdminScripts,
            },
            {
                path: 'plans',
                name: 'admin-plans',
                component: AdminPlans,
            },
        ]
    },

    // Organization Dashboard - redirect to unified settings
    {
        path: '/organizations/:orgId',
        redirect: '/settings/org-profile',
    },
    {
        path: '/organizations/:orgId/about',
        redirect: '/settings/org-profile',
    },
    {
        path: '/organizations/:orgId/members',
        redirect: '/settings/org-members',
    },

    // curation
    {path: '/curate', name: 'curation', component: () => import('@/views/CurationPage.vue')},
    {path: '/curate/works', name: 'curate-works', component: () => import('@/views/CurateWorks.vue')},
    {path: '/curate/works/:workId', name: 'curate-work-item', component: () => import('@/views/CurateWorkItem.vue'), props: true},
    {path: '/curate/sources', name: 'curate-sources', component: () => import('@/views/CurateSources.vue')},
    {path: '/curate/sources/:sourceId', name: 'curate-source-item', component: () => import('@/views/CurateSourceItem.vue'), props: true},
    {path: '/curate/moderation', name: 'moderation', component: () => import('@/views/ModerationPage.vue'), meta: { requiresAuth: true }},
    
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
    
    // Handle legacy v2 parameter - convert to data-version=2
    if (to.query.v2 !== undefined) {
        const newQuery = { ...to.query };
        delete newQuery.v2;
        newQuery['data-version'] = '2';
        return next({
            ...to,
            query: newQuery,
            replace: true
        });
    }

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

    // Enforce admin access for admin routes
    if (to.matched.some(record => record.meta.requiresAdmin) && !store.getters["user/isAdmin"]) {
        return next({ name: 'Home' });
    }

    next();
});

export default router;