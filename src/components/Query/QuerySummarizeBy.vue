<template>
  <v-menu max-height="70vh" rounded offset-y>
    <template v-slot:activator="{ on }">
      <v-chip label class="entity-chip" compact :color="buttonColor" v-on="on">
        {{ buttonName }}
        <v-icon right>mdi-menu-down</v-icon>
      </v-chip>
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
          <v-list-item-title>{{this.uiVariant === 'worksfirst' ? 'none' : 'Works'}}</v-list-item-title>
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
</template>


<script>

import {mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";


export default {
  name: "QuerySummarizeBy",
  components: {},
  props: {},
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("search", [
      "query",
      "querySubjectEntityConfig",
    ]),
    entities() {
      return Object.values(getConfigs()).filter(config => config.id !== 'works');
    },
    buttonName() {
      const entity = this.query.get_rows;
      if (entity === 'summary') { return "Works Summary"; }
      const name = getConfigs()[entity].displayName;
      return this.uiVariant === 'worksfirst' && name === "works" ? 'none' : name.titleCase();
    },
    buttonColor() {
      if (this.uiVariant === 'worksfirst') { return 'catEntity'; }
      return ['works', 'summary'].includes(this.query.get_rows) ? 'catWorks' : 'catEntity';
    },
    selected: {
      get() {
        return this.query.summarize;
      },
      set(value) {
        console.log("setSummarize", value);
        this.setSummarize(value);
      }
    },
  },
  methods: {
    ...mapMutations("search", [
      "setSummarize",
    ]),
  },
}
</script>


<style scoped lang="scss">
.query-summarize-by-button {
  padding-right: 4px;
}
</style>