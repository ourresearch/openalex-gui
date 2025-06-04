<template>
  <v-menu max-height="70vh" rounded offset-y>
    <template v-slot:activator="{ props }">
      <v-chip label :class="['entity-chip', {'none': buttonName === 'none'}]" compact :color="buttonColor" v-bind="props">
        <span v-if="uiVariant === 'sentence-group' && subjectEntity === null">
            <v-icon size="small">mdi-layers-triple-outline</v-icon>
          </span>
        <span v-else>
          {{ buttonName }}
          <v-icon v-if="uiVariant === 'sentence-group'" class="down-icon" size="small" @click.stop.prevent="() => {selected = 'works'; }">mdi-close</v-icon>
          <v-icon v-else class="down-icon" end>mdi-menu-down</v-icon>
        </span>
      </v-chip>
    </template>

    <v-list>
      <v-list-item-group v-model="selected">
        <v-list-item
          value="works"
          active-class="primary--text"
          v-if="uiVariant !== 'sentence-group'"
        >
          <v-list-item-icon>
            <v-icon>mdi-file-document-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{this.uiVariant === 'worksfirst' ? 'none' : 'Works'}}</v-list-item-title>
        </v-list-item>

        <v-subheader>Group works by:</v-subheader>
        <v-divider/>
        <!-- Show popular entities first -->
        <v-list-item
            v-for="entity in popularEntities"
            :key="entity.id"
            :value="entity.id"
            active-class="primary--text"
        >
          <v-list-item-icon>
            <v-icon>{{ entity.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
          <v-list-item-icon v-if="selected === entity.id">
            <v-icon>mdi-check</v-icon>
          </v-list-item-icon>
        </v-list-item>


        
        <v-divider/>

        <!-- Remaining entities in alphabetical order -->
        <v-list-item
            v-for="entity in remainingEntitiesSorted"
            :key="entity.id"
            :value="entity.id"
            active-class="primary--text"
        >
          <v-list-item-icon>
            <v-icon>{{ entity.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
          <v-list-item-icon v-if="selected === entity.id">
            <v-icon>mdi-check</v-icon>
          </v-list-item-icon>
        </v-list-item>

      </v-list-item-group>
    </v-list>
  </v-menu>
</template>


<script>

import {mapGetters, mapMutations, mapActions} from "vuex";
import filters from "@/filters";
import {getConfigs} from "@/oaxConfigs";


export default {
  name: "QuerySummarizeBy",
  components: {},
  props: {
    subjectEntity: {
      type: String,
      default: null,
    },
  },
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("search", [
      "query",
      "querySubjectEntityConfig",
      "hasQueryChanged",
      "queryIsCompleted",
    ]),
    entities() {
      return Object.values(getConfigs()).filter(config => config.id !== 'works');
    },
    popularEntities() {
      // Create a special config for summary since it's not a standard entity
      const summaryConfig = {
        id: 'summary',
        displayName: 'Works Summary',
        icon: 'mdi-file-document'
      };
      
      // Add other popular entities
      const popularIds = ['authors', 'institutions', 'funders', 'topics'];
      const entities = popularIds
        .map(id => this.getEntityConfig(id))
        .filter(entity => entity !== null);
        
      // Add summary after topics
      entities.push(summaryConfig);
      
      return entities;
    },
    remainingEntitiesSorted() {
      const popularIds = ['authors', 'institutions', 'funders', 'topics'];
      return this.entities
        .filter(entity => !popularIds.includes(entity.id) && entity.id !== 'works' && entity.id !== 'summary')
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    },
    resultsCount() {
      if (!this.queryIsCompleted || this.hasQueryChanged) { return null; }
      const formatter = Intl.NumberFormat('en', { notation: 'compact' });
      return this.resultsMeta ? formatter.format(this.resultsMeta.count) : null;
    },
    buttonName() {
      const entity = this.query.get_rows;
      if (entity === 'summary') { 
        return "Works Summary"; 
      }
      const name = getConfigs()[entity].displayName;
      if (["sentence-group", "sentence-worksfirst", "worksfirst"].includes(this.uiVariant) && name === "works") {
        return 'none';
      }
      return filters.titleCase(name);
    },
    buttonColor() {
      if (this.uiVariant === 'sentence-group') {
        if (this.subjectEntity === null) { return 'catEntity'; }
        return ['works', 'summary'].includes(this.query.get_rows) ? 'catWorks' : 'catEntity';
      }
      if (this.subjectEntity === null) { return 'catEntity'; }
      if (["worksfirst"].includes(this.uiVariant)) { return 'catEntity'; }
      return ['works', 'summary'].includes(this.query.get_rows) ? 'catWorks' : 'catEntity';
    },
    selected: {
      get() {
        return this.query.summarize;
      },
      set(value) {
        console.log("setSummarize", value);
        this.setSummarize(value);
        if (this.uiVariant === 'sentence-group') {
          this.createSearch();
        }
      }
    },
  },
  methods: {
    ...mapMutations("search", [
      "setSummarize",
    ]),
    ...mapActions("search", [
      "createSearch",
    ]),
    getEntityConfig(entityId) {
      const configs = getConfigs();
      return configs[entityId] || null;
    },
  },
}
</script>


<style scoped lang="scss">
.query-summarize-by-button {
  padding-right: 4px;
}
.down-icon {
  margin-left: -2px !important; 
}
.entity-chip.none {
  font-weight: normal;
  font-size: 16px !important;
  min-width: 28px;
}
</style>