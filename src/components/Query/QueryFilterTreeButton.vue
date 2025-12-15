<template>
  <DropdownMenu v-model:open="isMenuOpen">
    <DropdownMenuTrigger asChild>
      <Button
        :class="{'px-2': !props.text.length}"
        :variant="buttonColor.includes('Darker') ? 'default' : 'secondary'"
        size="sm"
      >
        <Plus class="h-4 w-4" :class="props.text ? 'mr-1' : ''" />{{ props.text }}
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-[250px]" v-if="isMenuOpen">
      <div class="p-2">
        <div class="relative">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            v-model="search"
            autofocus
            placeholder="Search filters"
            class="pl-8"
            @keydown.down="onDownArrow"
          />
        </div>
      </div>

      <DropdownMenuSeparator />

      <div class="max-h-[calc(60vh-56px)] overflow-y-auto py-1">
        <template v-if="filteredFilters.length > 0">
          <DropdownMenuItem
            v-for="(column, i) in filteredFilters"
            :key="column.id"
            :class="lineBetweenPopularIndex === i ? 'border-t' : ''"
            @click="$emit('addFilter', column)"
          >
            <component :is="getIcon(column.icon)" class="h-4 w-4 mr-2" />
            {{ filters.titleCase(column.displayName) }}
          </DropdownMenuItem>
        </template>
        <template v-else>
          <div class="px-2 py-1.5 text-sm text-muted-foreground">No matching filters.</div>
        </template>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>


<script setup>
import { computed, ref, watch } from "vue";

import { Plus, Search, FileText, Calendar, Users, Building, Globe, Tag, DollarSign, Lightbulb } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { getConfigs } from "@/oaxConfigs";
import filters from "@/filters";

// Map mdi icons to lucide icons
const iconMap = {
  'mdi-file-document': FileText,
  'mdi-calendar': Calendar,
  'mdi-account-group': Users,
  'mdi-domain': Building,
  'mdi-web': Globe,
  'mdi-tag': Tag,
  'mdi-currency-usd': DollarSign,
  'mdi-lightbulb': Lightbulb,
};

function getIcon(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

defineOptions({ name: "QueryFilterTreeButton" });

const props = defineProps({
  subjectEntity: String,
  text: {
    type: String,
    default: "Filter"
  }
});

const search = ref("");
const isMenuOpen = ref(false);

const buttonColor = computed(() => {
  let color = ['works', 'summary'].includes(props.subjectEntity) ? 'catWorks' : 'catEntity';
  if (props.text.length > 0) {
    color += 'Darker';
  }
  return color;
});

const availableFilters = computed(() => {
  const myConfig = getConfigs()[props.subjectEntity];
  const myPossibleColumns = Object.values(myConfig.columns);
  return myPossibleColumns.filter(f => {
    return f.actions && f.actions.includes("filter");
  });
});

const popularFilters = computed(() =>
  availableFilters.value.filter(f =>
    f.actionsPopular && f.actionsPopular.includes("filter")
  )
);

const nonpopularFilters = computed(() =>
  availableFilters.value.filter(f =>
    !f.actionsPopular || !f.actionsPopular.includes("filter")
  )
);

function filterFiltersBySearch(columns) {
  return columns.filter(f =>
    f.displayName.toLowerCase().includes(search.value.toLowerCase())
  );
}

const filteredPopularFilters = computed(() =>
  filterFiltersBySearch(popularFilters.value)
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
);

const filteredNonpopularFilters = computed(() =>
  filterFiltersBySearch(nonpopularFilters.value)
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
);

const filteredFilters = computed(() =>
  filteredPopularFilters.value.concat(filteredNonpopularFilters.value)
);

const lineBetweenPopularIndex = computed(() => {
  return (filteredPopularFilters.value.length === 0 ||
          filteredNonpopularFilters.value.length === 0)
    ? -1
    : availableFilters.value.length > 5
      ? filteredPopularFilters.value.length
      : -1;
});

function onDownArrow(event) {
  event.preventDefault();
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll(focusableElements))
    .filter(el => !el.disabled && el.offsetParent !== null);

  const currentIndex = elements.indexOf(event.target);
  if (currentIndex > -1 && currentIndex < elements.length - 1) {
    elements[currentIndex + 1].focus();
  } else if (elements.length > 0) {
    elements[0].focus();
  }
}

watch(isMenuOpen, 
  (newVal) => {
    if (!newVal) {
      search.value = "";
    }
  }
);
</script>


<style scoped lang="scss">
.line-above {
  border-top: 1px #DDD solid;
}
.inline-block {
  display: inline-block;
}
</style>