<template>
  <div>
    <!-- you can only save works searches for now -->
    <div v-if="entityType === 'works'">
      <v-btn v-if="!userId" rounded variant="text" class="font-weight-regular" @click="clickTitle">
         Unsaved search
        <v-icon class="ml-1">mdi-menu-down</v-icon>
      </v-btn>
      <v-menu v-else location="bottom">
        <template v-slot:activator="{props}">
          <v-btn
            v-bind="props"
            variant="text"
            rounded
            class="font-weight-regular"
          >
            {{ activeSearchObj?.name || "Unsaved search" }}
            <v-icon class="ml-1">mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <saved-search-menu
          :id="$route.query.id"
          @save="$emit('save')"
          @toggle-alert="$emit('toggle-alert')"
        />
      </v-menu>

    </div>

    <v-dialog v-model="isLoginRequiredDialogOpen" max-width="500">
      <v-card rounded>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          To save searches, please log in or sign up.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

    <saved-search-save-dialog
      :is-open="isDialogOpen.saveSearch"
      @close="isDialogOpen.saveSearch = false"
    />

  </div>
</template>


<script setup>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import SavedSearchSaveDialog from '@/components/SavedSearch/SavedSearchSaveDialog.vue';
import SavedSearchMenu from '@/components/SavedSearch/SavedSearchMenu.vue';

defineOptions({ name: 'SerpToolbarTitle' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const isLoginRequiredDialogOpen = ref(false);
const isDialogOpen = reactive({
  saveSearch: false,
});

// Vuex getters
const entityType = computed(() => store.getters['entityType']);
const userId = computed(() => store.getters['user/userId']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);


// Vuex mutations
const setRenameId = (id) => store.commit('user/setRenameId', id);

// Methods
function clickLogin() {
  isLoginRequiredDialogOpen.value = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

function clickSignup() {
  isLoginRequiredDialogOpen.value = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

function clickTitle() {
  if (userId.value) {
    if (route.query.id) {
      setRenameId(route.query.id);
    } else {
      isDialogOpen.saveSearch = true;
    }
  } else {
    isLoginRequiredDialogOpen.value = true;
  }
}
</script>