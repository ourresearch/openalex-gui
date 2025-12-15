<template>
  <TooltipProvider>
  <div class="min-h-screen bg-background font-sans antialiased">
    <!-- Global loading bar -->
    <Progress 
      v-if="globalIsLoading" 
      :indeterminate="true"
      class="fixed top-0 left-0 w-full z-[9999] h-1"
    />
    
    <!-- Header / App Bar -->
    <header class="sticky top-0 z-50 w-full border-b bg-white">
      <div class="flex items-center px-4" :class="smAndDown ? 'h-14' : 'h-[70px]'">
        <!-- Logo -->
        <router-link :to="homeRoute" class="flex items-center gap-1 no-underline">
          <img
            src="@/assets/tricon.png"
            class="h-5"
            alt="OpenAlex"
          />
          <span class="text-lg font-bold tracking-tight text-foreground">OpenAlex</span>
        </router-link>

        <!-- Search area (Serp page) -->
        <div
          v-if="$route.name === 'Serp' && !smAndDown"
          class="flex-1 flex justify-center mx-6"
        >
          <entity-type-selector />
          <shortcut-box
            style="max-width: 800px;"
            class="flex-1"
          />
        </div>
        <div v-else class="flex-1"></div>

        <!-- Right side actions -->
        <div class="flex items-center gap-2">
          <user-toolbar-menu/>

          <!-- Help menu -->
          <DropdownMenu v-if="!smAndDown">
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <HelpCircle class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem as="a" href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
                <MessageCircleQuestion class="mr-2 h-4 w-4" />
                Contact support
              </DropdownMenuItem>
              <DropdownMenuItem as="a" href="https://help.openalex.org/" target="_blank">
                <HelpCircle class="mr-2 h-4 w-4" />
                Visit help center
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Mobile extension for Serp -->
      <div v-if="smAndDown && $route.name === 'Serp'" class="flex items-center px-4 h-[70px] border-t">
        <entity-type-selector/>
        <shortcut-box class="flex-1"/>
      </div>
    </header>

    <!-- Main content -->
    <main class="min-h-[calc(100vh-70px)]">
      <router-view></router-view>
    </main>

    <entity-drawer />

    <site-footer/>

    <!-- Toast notifications -->
    <Toaster />

    <saved-search-rename-dialog/>
    <saved-search-edit-alert-dialog/>
  </div>
  </TooltipProvider>
</template>


<script setup>
defineOptions({ name: 'App' });

import { ref, computed, onMounted, onBeforeMount, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useBreakpoints } from '@/composables/useBreakpoints';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { HelpCircle, MessageCircleQuestion } from 'lucide-vue-next';

import { getConfigs } from '@/oaxConfigs';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';

import UserToolbarMenu from '@/components/User/UserToolbarMenu.vue';
import SavedSearchRenameDialog from '@/components/SavedSearch/SavedSearchRenameDialog.vue';
import SavedSearchEditAlertDialog from '@/components/SavedSearch/SavedSearchEditAlertDialog.vue';
import SiteFooter from './components/SiteFooter.vue';
import ShortcutBox from '@/components/ShortcutBox.vue';
import EntityDrawer from '@/components/Entity/EntityDrawer.vue';
import EntityTypeSelector from '@/components/EntityTypeSelector.vue';

const store = useStore();
const router = useRouter();

const { mobile, smAndDown } = useBreakpoints();

const exportObj = ref({ progress: 0 });

const globalIsLoading = computed(() => store.getters.globalIsLoading);

const homeRoute = computed(() => {
  const route = { name: 'Home' };
  if (store.state.useV2) {
    route.query = { 'data-version': '2' };
  }
  return route;
});

// Head
useHead({
  titleTemplate: (title) => (title ? `${title} | OpenAlex` : 'OpenAlex'),
  link: [],
  meta: []
});

function setFeatureFlags() {
  let urlParams = new URLSearchParams(window.location.search);
  
  // Handle legacy v2 parameter - redirect to data-version=2
  if (urlParams.has('v2')) {
    urlParams.delete('v2');
    urlParams.set('data-version', '2');
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.replaceState({}, '', newUrl);
  }
  
  const ui = urlParams.get('ui');
  if (ui) {
    store.state.uiVariant = ui;
  }
  const useElastic = urlParams.has('elastic');
  if (useElastic) {
    store.commit("setUseElasticForAnalytics", true);
  }
  const useV2 = urlParams.get('data-version') === '2';
  if (useV2) {
    store.state.useV2 = true;
  }
  const showEntityPageStats = urlParams.has('entity-stats');
  if (showEntityPageStats) {
    store.commit("setShowEntityPageStats", true);
  }
}

// Lifecycle
onBeforeMount(() => {
  setFeatureFlags();

  if (router) {
    router.afterEach((to) => {
      if (window.zE) {
        if (to.path.startsWith('/analytics') || to.path.startsWith('/s/') || to.path === '/s') {
          window.zE('webWidget', 'show');
        } else {
          window.zE('webWidget', 'hide');
        }
      }
    });

    if (window.zE) {
      const currPath = router.currentRoute.value.path;
      if (currPath.startsWith('/analytics') || currPath.startsWith('/s/')) {
        window.zE('webWidget', 'show');
      } else {
        window.zE('webWidget', 'hide');
      }
    }
  }
});

onMounted(() => {
  const root = getCurrentInstance().appContext.app;
  root.configs = getConfigs();

  // Load plans at app boot for use across the app
  store.dispatch('fetchPlans');

  setInterval(async () => {
    if (!store.state.exportProgressUrl) return;
    const resp = await axios.get(store.state.exportProgressUrl);
    console.log(resp.data);
    exportObj.value = resp.data;
    if (exportObj.value === 1) {
      exportObj.value = null;
      store.state.exportProgressUrl = null;
    }
  }, 1000);
});
</script>


<style>
/* Minimal global styles for shadcn-vue migration */
html, body {
  overflow: initial;
}

.keyboard-shortcut {
  color: #9e9e9e;
  border: 1px solid #ccc;
  padding: 0 5px;
  border-radius: 5px;
}

.monospace {
  font-family: monospace !important;
}

/* Links styling */
a {
  color: #1976D2;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* Settings page */
.settings-page {
  max-width: 680px;
  padding: 48px;
}
@media (max-width: 600px) {
  .settings-page {
    padding: 16px;
  }
}

.settings-page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 32px;
}

.settings-value {
  font-size: 13px;
  color: #1A1A1A;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  background-color: #F5F5F5;
  padding: 4px 8px;
  border-radius: 4px;
}

img.site-footer-logo {
  width: 60px;
}

.page {
  margin-top: 50px;
}

.capitalize-first-letter::first-letter {
  text-transform: uppercase !important;
}
</style>