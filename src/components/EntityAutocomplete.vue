<template>
  <v-autocomplete
    v-model="selectedEntity"
    ref="autocomplete"
    @input="onEntitySelected"
    :items="entities"
    :loading="loading"
    :search-input.sync="search"
    item-text="display_name"
    item-value="id"
    :placeholder="`Search ${entityType}`"
    return-object
    v-bind="$attrs"
    v-on="$listeners"
    filled
    dense
    hide-no-data
    hide-details
  >
    <template v-slot:item="{ item }">
      <v-list-item-content>
        <v-list-item-title>{{ item.display_name }}</v-list-item-title>
        <v-list-item-subtitle v-if="item.hint || showWorkCounts">
          {{ item.hint}}
          <span v-if="item.hint && showWorkCounts">, </span>
          <span v-if="showWorkCounts">{{ item.works_count}} works</span>
        </v-list-item-subtitle>
      </v-list-item-content>
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
    }
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
    async searchEntities(query) {
      this.loading = true;
      try {
        const response = await api.getAutocomplete(this.entityType, {q: query});
        this.entities = response;
      } catch (error) {
        console.error(`Error fetching ${this.entityType}:`, error);
        this.entities = [];
      } finally {
        this.loading = false;
      }
    },
    onEntitySelected(entity) {
      if (!entity) { return; }
      //console.log("onEntitySelected")
      //console.log(entity)
      if (entity?.short_id) { entity.id = entity.short_id; }
      this.$emit('entity-selected', entity);
      this.selectedEntity = null;
      this.search = "";

      // Annoyingly use $nextTick to ensure that the DOM updates before resetting the input
      this.$nextTick(() => {
        this.$refs.autocomplete && this.$refs.autocomplete.reset();
      });
    },
  },
  created() {
    this.debouncedSearchEntities = debounce(this.searchEntities, 300);
  },
  watch: {
    search(val) {
      if (this.localValueOptions) {
        this.entities = this.localValueOptions;
      }
      else if (val) {
        this.debouncedSearchEntities(val);
      } else {
        this.entities = [];
      }
    },
  },
};
</script>