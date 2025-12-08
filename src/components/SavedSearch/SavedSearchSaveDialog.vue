<template>
  <v-dialog v-model="myIsOpen" max-width="500">
    <v-card :loading="isLoading" :disabled="isLoading" v-if="userId" flat rounded>
      <v-card-title>{{ myHasAlert ? "Create Alert" : "Save Search" }}</v-card-title>
      <v-card-subtitle v-if="myHasAlert">
        Save this search and subscribe to alerts
      </v-card-subtitle>
      <div class="pa-4 pb-0">
        <v-text-field
            autofocus
            rounded
            variant="solo-filled"
            flat
            clearable
            placeholder="Name (required)"
            v-model="nameString"
            @keydown.enter="save"
            counter="25"
        />
        <v-textarea
            rounded
            variant="solo-filled"
            flat
            placeholder="Description (optional)"
            v-model="descriptionString"
            @keydown.meta.enter="save"
            counter="200"
        />
      </div>
      <v-list nav class="pt-0 pb-6 px-6">
        <v-list-item @click="myHasAlert = !myHasAlert">
          <template #prepend>
            <v-switch readonly color="primary" v-model="myHasAlert" class="mr-2 mt-2"/>
          </template>
          
          <v-list-item-title class="text-subtitle-1 mb-1">
            Receive alerts
          </v-list-item-title>
          <v-list-item-subtitle class="text-body-2" style="white-space: normal;">
            Get an email when new results appear in this search
          </v-list-item-subtitle>
        </v-list-item>

      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" rounded @click="myIsOpen = false">Cancel</v-btn>
        <v-btn variant="flat" rounded color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        To {{ myHasAlert ? "set alerts" : "save searches" }}, you must be signed up and logged in.
      </v-card-text>
      <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'SavedSearchSaveDialog' });

const props = defineProps({
  isOpen: Boolean,
  hasAlert: Boolean,
});

const emit = defineEmits(['close']);

const store = useStore();
const route = useRoute();
const router = useRouter();

const nameString = ref('');
const descriptionString = ref('');
const isLoading = ref(false);
const myHasAlert = ref(false);

const userId = computed(() => store.getters['user/userId']);

const currentUrl = computed(() => `https://openalex.org${route.fullPath}`);

const myIsOpen = computed({
  get() {
    return props.isOpen;
  },
  set() {
    emit('close');
  },
});

const snackbar = (msg) => store.commit('snackbar', msg);

const createSearch = (payload) => store.dispatch('user/createSearch', payload);

// Methods
async function save() {
  console.log('save search', nameString.value, myHasAlert.value);
  isLoading.value = true;
  await createSearch({
    search_url: currentUrl.value,
    name: nameString.value,
    description: descriptionString.value,
    has_alert: myHasAlert.value,
  });
  myIsOpen.value = false;
  isLoading.value = false;
  snackbar('Search saved.');
}

function clickSignup() {
  myIsOpen.value = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

function clickLogin() {
  myIsOpen.value = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

// Watchers
watch(
  () => props.isOpen,
  () => {
    nameString.value = '';
    descriptionString.value = '';
    myHasAlert.value = props.hasAlert;
  }
);
</script>