<template>
  <div>
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
      v-bind="$attrs"
      v-on="$listeners"
      variant="outlined"
      :color="filterColor"
      density="compact"
      hide-no-data
      hide-details
      no-filter
      autofocus
    >
      <template v-slot:item="{ item }">
        
          <v-list-item-title>{{ item.display_name }}</v-list-item-title>
          <v-list-item-subtitle v-if="item.hint || showWorkCounts">
            {{ item.hint}}
            <span v-if="item.hint && showWorkCounts">, </span>
            <span v-if="showWorkCounts">{{ item.works_count}} works</span>
          </v-list-item-subtitle>
        
      </template>
    </v-autocomplete>
  </div>
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
    };
  },
  computed: {
    localValueOptions() {
      const values = getConfigs()[this.entityType]?.values;
      return values;
    },
  },
  methods: {
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