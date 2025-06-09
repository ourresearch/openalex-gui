<template>
  <v-autocomplete
    v-model="selectedEntity"
    class="query-builder-input"
    ref="autocomplete"
    @update:model-value="onEntitySelected"
    :items="entities"
    :loading="loading"
    :search="search"
    @update:search="onSearchInputUpdate"
    item-title="display_name"
    item-value="id"
    :placeholder="`Search ${entityType}`"
    return-object
    density="compact"
    v-bind="$attrs"
    variant="outlined"
    :color="filterColor"
    hide-no-data
    hide-details
    :custom-filter="() => true"
    autofocus
    @update:menu="onMenuUpdate"
  >
    <template v-slot:item="{ item, props }">
      <v-list-item
        v-bind="props"
        :title="item.raw.display_name"
        :subtitle="(item.raw.hint || showWorkCounts) ? 
          `${item.raw.hint || ''}${item.raw.hint && showWorkCounts ? ', ' : ''}${showWorkCounts ? item.raw.works_count + ' works' : ''}` : undefined"
      ></v-list-item>
    </template>
  </v-autocomplete>
</template>

<script>

import {api} from "@/api";
import {debounce} from 'lodash';
import {getConfigs} from "@/oaxConfigs";


export default {
  name: "EntityAutocomplete",
  inheritAttrs: false,
  props: {
    entityType: {
      type: String,
      required: true,
    },
    showWorkCounts: {
      type: Boolean,
      default: false
    },
    filterColor: {
      type: String,
      default: "primary"
    },
  },
  data() {
    return {
      selectedEntity: null,
      entities: [],
      loading: false,
      search: null,
      isMenuOpen: false,
    };
  },
  computed: {
    localValueOptions() {
      const values = getConfigs()[this.entityType]?.values;
      return values;
    },
  },
  methods: {
    onMenuUpdate(isOpen) {
      this.isMenuOpen = isOpen;
      this.$emit('menu-state-change', isOpen);
    },
    onSearchInputUpdate(val) {
      this.search = val;
      if (val && val.length > 0) {
        this.debouncedSearchEntities(val);
      } else {
        this.entities = [];
      }
    },
    async searchEntities(query) {
      if (!query || query.length === 0) {
        this.entities = this.localValueOptions || [];
        return;
      }

      this.loading = true;
      try {
        const response = await api.getAutocomplete(this.entityType, {q: query});
        
        if (response && response.length > 0) {
          this.entities = response;
        } else {
          this.entities = this.localValueOptions || [];
        }
      } catch (error) {
        console.error(`Error fetching ${this.entityType}:`, error);
        this.entities = this.localValueOptions || [];
      } finally {
        this.loading = false;
      }
    },
    onEntitySelected(entity) {
      if (!entity) { return; }
      if (entity?.short_id) { entity.id = entity.short_id; }
      this.$emit('entity-selected', entity);
      this.selectedEntity = null;
      this.search = "";
    },
  },
  created() {
    this.debouncedSearchEntities = debounce(this.searchEntities, 300);
  },
  watch: {
    // Search input is now handled by onSearchInputUpdate
    // Keeping the watcher for localValueOptions changes
    localValueOptions: {
      handler(newVal) {
        if (newVal) {
          this.entities = newVal;
        }
      },
      immediate: true
    }
  },
};
</script>

<style scoped>
.v-input__slot {
  min-height: 35px !important;
}
</style>