<template>
  <div class="d-flex align-center pr-3">

    <!-- you can only get alerts for new works -->
    <v-btn
      v-if="entityType === 'works'"
      icon
      @click="$emit('toggle-alert')"
    >
      <template v-if="activeSearchHasAlert">
        <!-- Remove alert-->
        <v-icon color="grey-darken-1">mdi-bell-check</v-icon>
      </template>
      <template v-else>
        <!-- Create alert-->
        <v-icon color="grey-darken-1">mdi-bell-outline</v-icon>
      </template>
    </v-btn>

    <v-menu location="bottom">
      <template v-slot:activator="{props}">
        <v-btn icon v-bind="props">
          <v-icon color="grey-darken-1">mdi-cog-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-subheader>
          Show on page:
        </v-list-subheader>
        <v-list-item
          v-for="view in url.viewConfigs"
          :key="view.id"
          @click="url.toggleView(view.id)"
        >
          <template #prepend>
            <v-icon>{{ view.icon }}</v-icon>
          </template>
          <v-list-item-title>
            {{ view.displayName }}
          </v-list-item-title>
          <template #append >
            <v-icon v-if="url.isViewSet($route, view.id)" class="pt-2">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu location="bottom">
      <template v-slot:activator="{props}">
        <v-btn icon v-bind="props">
          <v-icon color="grey-darken-1">mdi-share-variant</v-icon>
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
import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import QrcodeVue from 'qrcode.vue';

import { url } from '@/url';

defineOptions({ name: 'SerpToolbarMenu' });

const store = useStore();
const route = useRoute();

const isDialogOpen = reactive({
  qrCode: false,
});

// Vuex getters
const entityType = computed(() => store.getters['entityType']);
const activeSearchHasAlert = computed(() => store.getters['user/activeSearchHasAlert']);

// Computed props
const urlToShare = computed(() => `https://openalex.org${route.fullPath}`);
const isUrlTooBigForQR = computed(() => urlToShare.value.length > 3000);
const qrCodeSize = computed(() => {
  return window?.$vuetify?.display?.mdAndUp ? 400 : 300;
});

const snackbar = (val) => store.commit('snackbar', val);

async function copyUrlToClipboard() {
  await navigator.clipboard.writeText(urlToShare.value);
  snackbar('URL copied to clipboard.');
}
</script>