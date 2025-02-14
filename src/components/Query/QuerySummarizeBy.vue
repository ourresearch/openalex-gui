<template>
  <span class="d-inline-flex align-center">
    <v-menu max-height="70vh" rounded offset-y>
      <template v-slot:activator="{ on }">
        <v-btn rounded class="text-h6 " v-on="on">
          <v-icon left>{{ querySubjectEntityConfig?.icon || "mdi-file-document" }}</v-icon>
          <span>
            <template v-if="query.get_rows === 'summary'">
               Works Summary
            </template>
            <template v-else>
              {{ displayName | titleCase }}
            </template>
          </span>
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item-group v-model="selected">
           <v-list-item
               value="works"
               active-class="primary--text"
           >
            <v-list-item-icon>
              <v-icon>mdi-file-document-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Works</v-list-item-title>
          </v-list-item>
           <v-list-item
               value="summary"
               active-class="primary--text"
           >
            <v-list-item-icon>
              <v-icon>mdi-file-document</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Works Summary</v-list-item-title>
          </v-list-item>

          <v-subheader>Summarize works by:</v-subheader>
          <v-divider/>
          <v-list-item
              v-for="(entity, i) in entities"
              :key="i"
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
  </span>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";


export default {
  name: "QuerySummarizeBy",
  components: {},
  props: {},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("search", [
      "query",
      "querySubjectEntityConfig",
    ]),
    entities() {
      return Object.values(getConfigs()).filter(config => config.id !== 'works');
    },
    displayName() {
      return getConfigs()[this.query.get_rows].displayName;
    },
    selected: {
      get() {
        return this.query.get_rows;
      },
      set(value) {
        console.log("setSummarize", value);
        this.setSummarize(value);
        this.createSearch();
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
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>


<style scoped lang="scss">

</style>