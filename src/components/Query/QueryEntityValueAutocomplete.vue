<template>
  <v-autocomplete
    v-model="selectedEntity"
    @change="onEntitySelected"
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
  >
<!--    :label="`Select ${entityType}`"-->
    <template v-slot:item="{ item }">
      <v-list-item-content>
        <v-list-item-title v-text="item.display_name"></v-list-item-title>
        <v-list-item-subtitle v-text="item.hint || ''"></v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <v-list-item-action-text v-text="`Works: ${item.works_count || 'N/A'}`"></v-list-item-action-text>
      </v-list-item-action>
    </template>
  </v-autocomplete>
</template>

<script>
import axios from 'axios';
import { debounce } from 'lodash';

export default {
  props: {
    entityType: {
      type: String,
      required: true,
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
  watch: {
    search(val) {
      if (val) {
        this.debouncedSearchEntities(val);
      } else {
        this.entities = [];
      }
    },
  },
  created() {
    this.debouncedSearchEntities = debounce(this.searchEntities, 300);
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
      this.$emit('entity-selected', entity);
    },
  },
};
</script>