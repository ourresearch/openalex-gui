<template>
  <span>
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" class="font-normal">
          <component :is="getIconComponent(selectedRoleConfig?.icon)" class="h-4 w-4 mr-2" />
          {{ filters.capitalize(selectedRoleConfig?.nameSingular) }}
          <ChevronDown class="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          v-for="role in rolesToShow"
          :key="role.id"
          as="router-link"
          :to="filters.entityZoomLink(role.id)"
        >
          <component :is="getIconComponent(getEntityConfig(role.role)?.icon)" class="h-4 w-4 mr-2" />
          {{ role.role }}
          <Check v-if="role.role === selected" class="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </span>
</template>

<script setup>
import { computed } from 'vue';

import { ChevronDown, Check, FileText, Users, BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';

import filters from '@/filters';
import { getEntityConfig } from '@/entityConfigs';

defineOptions({ name: 'LinkEntityRolesList' });

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

function getIconComponent(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

const { roles, hideRole, selected } = defineProps({
  roles: Array,
  hideRole: String,
  selected: String
});

const rolesToShow = computed(() => {
  return roles.filter(r => r.role !== hideRole);
});

const selectedRoleConfig = computed(() => {
  return getEntityConfig(selected);
});
</script>