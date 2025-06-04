<template>
  <span class="query-outline-view">
    <!-- Button that opens the dialog -->
    <v-btn size="small" class="query-outline-button" color="catPurple" @click="openDialog">
      <v-icon size="small">mdi-format-list-bulleted</v-icon>
    </v-btn>

    <!-- Dialog component -->
    <v-dialog
      v-model="dialogOpen"
      content-class="query-outline-dialog"
      max-width="600px"
      :retain-focus="false"
    >
      <v-card class="query-builder">
        <v-tabs class="query-outline-tabs" v-model="activeTab" dense>
          <v-tab>Outline</v-tab>
          <v-tab>JSON</v-tab>
          <v-tab>OQL</v-tab>
          <v-tab>SQL</v-tab>
          <!-- <v-tab>API</v-tab> -->
        </v-tabs>

        <v-window v-model="activeTab">
          <v-window-item value="0">
            <div class="pa-6 pb-0">
              <template v-if="uiVariant === 'sentence-worksfirst'">
                <query-filter-tree
                  subject-entity="works"
                  :isWithAggs="querySubjectEntity !== 'works'"
                  :filters="query.filter_works" />
                <query-filter-tree
                  v-if="querySubjectEntity !== 'works'"
                  :subject-entity="querySubjectEntity"
                  :filters="query.filter_aggs" />
                <div class="section-divider clear" />
                <query-columns-controls 
                  v-if="querySubjectEntity !== 'works'"
                  :isExpanded="false"
                  :show-sections="['display']" />
                <query-columns-controls
                  :show-sections="querySubjectEntity === 'works' ? ['display', 'calculate', 'sort'] : ['calculate', 'sort']"
                  :isExpanded="false" />
              </template>
              <template v-else-if="uiVariant === 'sentence-entityfirst'">
                <query-filter-tree
                  v-if="querySubjectEntity !== 'works'"
                  :subject-entity="querySubjectEntity"
                  :filters="query.filter_aggs" />
                <query-columns-controls 
                  v-if="querySubjectEntity !== 'works'"
                  :isExpanded="query.filter_aggs.length > 0"
                  :show-sections="['display']" />
                <query-filter-tree
                  subject-entity="works"
                  :isWithAggs="querySubjectEntity !== 'works'"
                  :filters="query.filter_works" />
                <query-columns-controls
                  :show-sections="querySubjectEntity === 'works' ? ['display', 'calculate', 'sort'] : ['calculate', 'sort']"
                  :isExpanded="query.filter_works.length > 0" />
              </template>
            </div>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey-darken-1" variant="text" @click="cancelClick">Cancel</v-btn>
              <v-btn color="primary" @click="searchClick">Search</v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="1">
            <v-card flat><v-card-text><pre>{{ query }}</pre></v-card-text></v-card>
          </v-window-item>

          <v-window-item value="2" class="pa-4">
            <search-from-text :disabled="!queryIsCompleted" />
          </v-window-item>

          <v-window-item value="3">
            <v-card flat><v-card-text><pre class="sql">{{ formattedSql }}</pre></v-card-text></v-card>
          </v-window-item>

          <!-- <v-window-item value="4">
            <v-card flat><v-card-text><a class="api-link" :href="searchApiUrl" target="_blank">{{ searchApiUrl }}</a></v-card-text></v-card>
          </v-window-item> -->
        </v-window>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import {mapGetters, mapActions} from "vuex";
import { format } from 'sql-formatter';
import { urlBase } from "@/apiConfig";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryColumnsControls from "@/components/Query/QueryColumnsControls.vue";
import SearchFromText from "@/components/SearchFromText.vue";

export default {
  name: "QueryOutlineView",
  components: {
    QueryFilterTree,
    QueryColumnsControls,
    SearchFromText
  },
  data() {
    return {
      dialogOpen: false,
      activeTab: 0, // Add state for tabs
    };
  },
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("search",[
      "query",
      "querySubjectEntity",
      "queryIsCompleted", 
      "querySql",
    ]),
    searchApiUrl() {
      return urlBase.api + '/analytics/' + this.$route.params.id;
    },
    formattedSql() {
      const rawSql = this.querySql;
      if (!rawSql) { return ""; }
      return format(rawSql, {language: "redshift"});
    }
  },
  methods: {
    ...mapActions('search', [
      'createSearch',
      'resetToSubmittedQuery'
    ]),
    openDialog() {
      this.dialogOpen = true;
    },
    cancelClick() {
      this.resetToSubmittedQuery();
      this.dialogOpen = false;
    },
    searchClick() {
      this.createSearch();
      this.dialogOpen = false;
    }
  }
};
</script>

<style lang="scss">
.query-outline-tabs {
  border-bottom: #e0e0e0 1px solid;
  margin-bottom: 10px;
  color: #555;
}
.query-builder .v-window-x-transition-enter-active,
.query-builder .v-window-x-transition-leave-active,
.query-builder .v-window-x-reverse-transition-enter-active,
.query-builder .v-window-x-reverse-transition-leave-active {
  transform: none !important;
}
.api-link {
  display: block;
  padding: 16px;
  word-break: break-all;
}
.sql {
  white-space: pre-wrap;
  overflow-x: scroll;
}
</style>
