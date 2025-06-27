<template>
  <v-menu class="rounded-lg inline-block" location="bottom" transition="none" v-model="isMenuOpen">
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        :class="{'query-builder-button': true, 'tight': !props.text.length}"
        :color="buttonColor"
        size="small"
        variant="flat"
      >
        <v-icon size="small">mdi-plus</v-icon>{{ props.text }}
      </v-btn>
    </template>
    <v-card flat class="rounded-o" style="width: 250px" v-if="isMenuOpen">
      <v-text-field
        v-model="search"
        bg-color="white"  
        variant="plain"
        hide-details
        autofocus
        placeholder="Search filters"
        @keydown.down="onDownArrow"
      >
        <template #prepend-inner>
          <v-icon color="primary">mdi-magnify</v-icon>
        </template>
      </v-text-field>
      <v-divider/>

      <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
        <v-list-item
          v-for="(column, i) in filteredFilters"
          :key="column.id"
          :class="lineBetweenPopularIndex === i ? 'line-above' : ''"
          @click="$emit('addFilter', column)"
        >
          <template #prepend>
            <v-icon>{{ column.icon }}</v-icon>
          </template>
          <v-list-item-title>
            {{ filters.titleCase(column.displayName) }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>


<script setup>
import { computed, ref, watch } from "vue";
import { getConfigs } from "@/oaxConfigs";
import filters from "@/filters";

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