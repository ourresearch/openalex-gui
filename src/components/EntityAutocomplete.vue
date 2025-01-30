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
    rounded
    filled
    hide-no-data
    hide-details
  >
    <template v-slot:item="{ item }">
      <v-list-item-content>
        <v-list-item-title v-text="item.display_name"></v-list-item-title>
        <v-list-item-subtitle v-text="item.hint || ''"></v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action v-if="showWorkCounts">
        <v-list-item-action-text v-text="`Works: ${item.works_count || 'N/A'}`"></v-list-item-action-text>
      </v-list-item-action>
    </template>
  </v-autocomplete>
</template>

<script>
import axios from 'axios';
import { debounce } from 'lodash';
import {getConfigs} from "@/oaxConfigs";


export default {
  name: "EntityAutocomplete",
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
      const values = getConfigs()[this.entityType]?.values
      return values
    },
  },
  methods: {
    async searchEntities(query) {
      this.loading = true;
      try {
        const response = await axios.get(`https://api.openalex.org/autocomplete/${this.entityType}`, {
          params: { q: query }
        });
        this.entities = response.data.results;
      } catch (error) {
        console.error(`Error fetching ${this.entityType}:`, error);
        this.entities = [];
      } finally {
        this.loading = false;
      }
    },
    onEntitySelected(entity) {
      if (!entity) { return }
      console.log("onEntitySelected")
      console.log(entity)
      if (entity?.short_id) { entity.id = entity.short_id }
      this.$emit('entity-selected', entity)
      this.selectedEntity = null
      this.search = ""

      // Annoyingly use $nextTick to ensure that the DOM updates before resetting the input
      this.$nextTick(() => {
        this.$refs.autocomplete.reset();
      })
    },
  },
  created() {
    this.debouncedSearchEntities = debounce(this.searchEntities, 300);
  },
  watch: {
    search(val) {
      if (this.localValueOptions) {
        this.entities = this.localValueOptions
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