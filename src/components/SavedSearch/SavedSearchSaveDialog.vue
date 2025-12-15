<template>
  <Dialog v-model:open="myIsOpen">
    <DialogContent class="max-w-[500px]">
      <template v-if="userId">
        <DialogHeader>
          <DialogTitle>{{ myHasAlert ? "Create Alert" : "Save Search" }}</DialogTitle>
          <DialogDescription v-if="myHasAlert">
            Save this search and subscribe to alerts
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <Input
            autofocus
            placeholder="Name (required)"
            v-model="nameString"
            @keydown.enter="save"
            maxlength="25"
          />
          <Textarea
            placeholder="Description (optional)"
            v-model="descriptionString"
            @keydown.meta.enter="save"
            maxlength="200"
          />
          <div 
            class="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
            @click="myHasAlert = !myHasAlert"
          >
            <Switch :checked="myHasAlert" @update:checked="myHasAlert = $event" />
            <div>
              <div class="font-medium">Receive alerts</div>
              <div class="text-sm text-muted-foreground">
                Get an email when new results appear in this search
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="myIsOpen = false">Cancel</Button>
          <Button @click="save" :disabled="isLoading">Save</Button>
        </DialogFooter>
      </template>

      <template v-else>
        <DialogHeader>
          <DialogTitle>Login required</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          To {{ myHasAlert ? "set alerts" : "save searches" }}, you must be signed up and logged in.
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="clickLogin">Log in</Button>
          <Button @click="clickSignup">Sign up</Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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