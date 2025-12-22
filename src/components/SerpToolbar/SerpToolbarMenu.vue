<template>
  <div class="d-flex align-center pr-3">

    <xpac-chip />

    <v-menu location="bottom">
      <template v-slot:activator="{props}">
        <v-btn icon v-bind="props">
          <v-icon color="grey-darken-1">mdi-share-variant-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="isDialogOpen.qrCode = true">
          <template #prepend>
            <v-icon>mdi-qrcode</v-icon>
          </template>
          <v-list-item-title>
            Get QR code to share
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="copyUrlToClipboard">
          <template #prepend>
            <v-icon>mdi-link-variant</v-icon>
          </template>
          <v-list-item-title>
            Copy link to share
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu location="bottom" v-model="isMenuOpen">
      <template v-slot:activator="{props}">
        <v-btn icon v-bind="props">
          <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-if="entityType === 'works'"
          @click="$emit('toggle-alert'); isMenuOpen = false"
        >
          <template #prepend>
            <v-icon v-if="activeSearchObj?.has_alert">mdi-bell-check</v-icon>
            <v-icon v-else>mdi-bell-outline</v-icon>
          </template>
          <v-list-item-title>
            {{ activeSearchObj?.has_alert ? 'Remove alert' : 'Create alert' }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="handleToggleApiView">
          <template #prepend>
            <v-icon>mdi-api</v-icon>
          </template>
          <v-list-item-title>
            Show API query
          </v-list-item-title>
          <template #append>
            <v-icon v-if="url.isViewSet($route, 'api')" class="pt-2">mdi-check</v-icon>
          </template>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item @click="handleToggleSample">
          <template #prepend>
            <v-icon>mdi-dice-multiple-outline</v-icon>
          </template>
          <v-list-item-title>
            Sample
          </v-list-item-title>
          <template #append>
            <v-icon v-if="url.isSampling($route)" class="pt-2">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-spacer/>

    <v-dialog :width="qrCodeSize" v-model="isDialogOpen.qrCode">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            QR code for this page:
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-card-text v-if="isUrlTooBigForQR">Add commentMore actions
          <v-alert  type="warning" text>
            Your current URL is too long to create a QR code.
          </v-alert>
        </v-card-text>
        <qrcode-vue v-else :value="urlToShare" :size="qrCodeSize" class=""/>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn color="primary" rounded @click="isDialogOpen.qrCode = false">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>


<script setup>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify'
import QrcodeVue from 'qrcode.vue';

import { url } from '@/url';
import XpacChip from '@/components/SerpToolbar/XpacChip.vue';

defineOptions({ name: 'SerpToolbarMenu' });

const store = useStore();
const route = useRoute();

const { mdAndUp } = useDisplay();

const isMenuOpen = ref(false);
const isDialogOpen = reactive({
  qrCode: false,
});

// Vuex getters
const entityType = computed(() => store.getters['entityType']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);

// Computed props
const urlToShare = computed(() => `https://openalex.org${route.fullPath}`);
const isUrlTooBigForQR = computed(() => urlToShare.value.length > 3000);
const qrCodeSize = computed(() => {
  return mdAndUp.value ? 400 : 300;
});

const snackbar = (val) => store.commit('snackbar', val);

async function copyUrlToClipboard() {
  await navigator.clipboard.writeText(urlToShare.value);
  snackbar('URL copied to clipboard.');
}

function handleToggleApiView() {
  isMenuOpen.value = false;
  url.toggleView('api');
}

function handleToggleSample() {
  isMenuOpen.value = false;
  url.toggleSample();
}
</script>