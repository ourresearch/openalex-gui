<template>
  <div class="flex items-center pr-3">

    <xpac-chip />

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 class="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="isDialogOpen.qrCode = true">
          <QrCode class="h-4 w-4 mr-2" />
          Get QR code to share
        </DropdownMenuItem>
        <DropdownMenuItem @click="copyUrlToClipboard">
          <Link class="h-4 w-4 mr-2" />
          Copy link to share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu v-model:open="isMenuOpen">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical class="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          v-if="entityType === 'works'"
          @click="$emit('toggle-alert'); isMenuOpen = false"
        >
          <BellCheck v-if="activeSearchObj?.has_alert" class="h-4 w-4 mr-2" />
          <Bell v-else class="h-4 w-4 mr-2" />
          {{ activeSearchObj?.has_alert ? 'Remove alert' : 'Create alert' }}
        </DropdownMenuItem>

        <DropdownMenuItem @click="handleToggleApiView">
          <Code class="h-4 w-4 mr-2" />
          Show API query
          <Check v-if="url.isViewSet($route, 'api')" class="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <div class="flex-1" />

    <Dialog v-model:open="isDialogOpen.qrCode">
      <DialogContent :class="qrCodeSize > 350 ? 'max-w-[450px]' : 'max-w-[350px]'">
        <DialogHeader>
          <DialogTitle>QR code for this page:</DialogTitle>
        </DialogHeader>
        <div v-if="isUrlTooBigForQR">
          <Alert variant="warning">
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>Your current URL is too long to create a QR code.</AlertDescription>
          </Alert>
        </div>
        <qrcode-vue v-else :value="urlToShare" :size="qrCodeSize" class="mx-auto" />
        <DialogFooter>
          <Button @click="isDialogOpen.qrCode = false">Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>


<script setup>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import QrcodeVue from 'qrcode.vue';

import { Share2, QrCode, Link, MoreVertical, BellCheck, Bell, Code, Check, AlertTriangle } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useBreakpoints } from '@/composables/useBreakpoints';
import { url } from '@/url';
import XpacChip from '@/components/SerpToolbar/XpacChip.vue';

defineOptions({ name: 'SerpToolbarMenu' });

const store = useStore();
const route = useRoute();

const { mdAndUp } = useBreakpoints();

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
</script>