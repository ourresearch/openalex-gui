<template>
  <span>
    <DropdownMenu v-model:open="isDialogOpen">
      <DropdownMenuTrigger>
        <Button 
          v-if="smAndDown" 
          variant="ghost" 
          size="lg"
          class="px-0"
        >
          <component :is="getEntityIcon(entityTypeConfig?.icon)" class="h-5 w-5" />
          <ChevronDown class="h-4 w-4" />
        </Button>
        <Button 
          v-else 
          variant="ghost" 
          size="lg"
          class="capitalize"
        >
          <component :is="getEntityIcon(entityTypeConfig?.icon)" class="h-5 w-5 mr-2" />
          {{ entityTypeConfig?.displayName }}
          <ChevronDown class="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-56">
        <DropdownMenuLabel>What are you looking for?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-for="entityOption in entityTypeOptions"
          :key="entityOption.name"
          :class="{ 'bg-accent': entityType === entityOption.name }"
          @click="entityType = entityOption.name"
        >
          <component :is="getEntityIcon(entityOption.icon)" class="mr-2 h-4 w-4" />
          <span class="capitalize flex-1">{{ entityOption.displayName }}</span>
          <Tooltip>
            <TooltipTrigger as-child>
              <Info class="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {{ entityOption.descr }}
            </TooltipContent>
          </Tooltip>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </span>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBreakpoints } from '@/composables/useBreakpoints';

import { 
  ChevronDown, Info, FileText, Users, BookOpen, Building2, 
  Landmark, Lightbulb, MapPin, Award, DollarSign
} from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { getEntityConfig, getEntityConfigs } from '../entityConfigs';
import { url } from '@/url';

defineOptions({ name: 'EntityTypeSelector' });

defineProps({
  inline: Boolean
});

const route = useRoute();
const router = useRouter();

const { smAndDown } = useBreakpoints();

const isDialogOpen = ref(false);

const entityType = computed({
  get() {
    return route.params.entityType;
  },
  set(to) {
    url.pushToRoute(router, {
      name: 'Serp',
      params: { entityType: to }
    });
  }
});

const entityTypeOptions = computed(() => {
  return getEntityConfigs().filter(c => c.hasSerp);
});

const entityTypeConfig = computed(() => {
  return getEntityConfig(entityType.value);
});

const iconMap = {
  'mdi-file-document-outline': FileText,
  'mdi-account-outline': Users,
  'mdi-book-open-page-variant-outline': BookOpen,
  'mdi-domain': Building2,
  'mdi-town-hall': Landmark,
  'mdi-lightbulb-outline': Lightbulb,
  'mdi-map-marker-outline': MapPin,
  'mdi-trophy-outline': Award,
  'mdi-cash-multiple': DollarSign,
};

function getEntityIcon(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}
</script>


<style scoped>
/* Minimal scoped styles */
</style>