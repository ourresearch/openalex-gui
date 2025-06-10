<template>
  <v-menu class="rounded-lg inline-block" location="bottom" transition="none" v-model="isMenuOpen">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        :class="{'query-builder-button': true, 'tight': !text.length}"
        :color="buttonColor"
        size="small"
        variant="flat"
      >
        <v-icon size="small">mdi-plus</v-icon>{{ text }}
      </v-btn>
    </template>
    <v-card flat class="rounded-o" style="width: 250px" v-if="isMenuOpen">
      <v-text-field
        v-model="search"
        bg-color="white"  
        variant="default"
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


<script>

import {getConfigs} from "@/oaxConfigs";
import filters from "@/filters";

export default {
  name: "QueryFilterTreeButton",
  components: {},
  props: {
    subjectEntity: String,
    text: {
      type: String, 
      default: "Filter"
    }
  },
  data() {
    return {
      search: "",
      isMenuOpen: false,
      filters,
    }
  },
  computed: {
    buttonColor() {
      let color =  ['works', 'summary'].includes(this.subjectEntity) ? 'catWorks' : 'catEntity';
      if (this.text.length > 0) {
        color += 'Darker';
      }
      return color;
    },
    availableFilters() {
      const mySubjectEntity = this.subjectEntity;
      const myConfig = getConfigs()[mySubjectEntity];
      const myPossibleColumns = Object.values(myConfig.columns);

      //console.log(myPossibleColumns)

      const availableFilters = myPossibleColumns.filter( f => {
        if  (!f.actions) {console.log(f.displayName + " / " + f.id + " missing 'actions'"); return false}
        return f.actions.includes("filter");
      });
      
      return availableFilters;
    },
    popularFilters() {
      return this.availableFilters.filter( f => {
        return (f.actionsPopular && f.actionsPopular.includes("filter"));
      })
    },
    nonpopularFilters() {
      return this.availableFilters.filter( f => {
        return (!f.actionsPopular || !f.actionsPopular.includes("filter"));
      })
    },
    filteredPopularFilters() {
      return this.filterFiltersBySearch(this.popularFilters)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName));
    },
    filteredNonpopularFilters() {
      return this.filterFiltersBySearch(this.nonpopularFilters)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName));
    },
    filteredFilters() {
      return this.filteredPopularFilters.concat(this.filteredNonpopularFilters);
    },
    lineBetweenPopularIndex() {
      // Location of the line between popular filters at top and remaining filters below, if any
      return (this.filteredPopularFilters.length === 0 
              || this.filteredNonpopularFilters.length === 0)
        ? -1
        : this.availableFilters.length > 5 ? this.filteredPopularFilters.length : -1;
    }, 
  },
  methods: {
    filterFiltersBySearch(columns) {
      //console.log(columns)
      return columns.filter( f => {
        return f.displayName.toLowerCase().includes(this.search.toLowerCase());
      })
    },
    onDownArrow(event) {
      // Prevent default behavior of the down arrow key
      event.preventDefault();
      
      // Get all focusable elements in the document
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(document.querySelectorAll(focusableElements))
        .filter(el => !el.disabled && el.offsetParent !== null); // Only visible and enabled elements
      
      // Find the current element's position in the focusable elements array
      const currentIndex = elements.indexOf(event.target);
      
      // Focus the next element if it exists, otherwise focus the first element
      if (currentIndex > -1 && currentIndex < elements.length - 1) {
        elements[currentIndex + 1].focus();
      } else if (elements.length > 0) {
        // If we're at the last element or can't find the current element, go to the first
        elements[0].focus();
      }
    },  
  },
  watch: {
    isMenuOpen(newValue) {
      if (!newValue) {
        this.search = "";
      }
    }
  }
}
</script>


<style scoped lang="scss">
.line-above {
  border-top: 1px #DDD solid;
}
.inline-block {
  display: inline-block;
}
</style>