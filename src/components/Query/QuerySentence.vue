<template>
  <div>
    <div :class="['query-sentence-container', {'in-progress': hasQueryChanged || isSearchCanceled}]">
      <div class="query-sentence-box">
        <div class="query-sentence">
          <!-- Work First -->
          <template v-if="uiVariant === 'sentence-worksfirst'">
            <!-- Works Filters -->
            <query-filter-tree
            subject-entity="works"
            :isWithAggs="querySubjectEntity !== 'works'"
            :filters="query.filter_works"
            :is-sentence="true" />

          <!-- Entity Filters -->
          <query-filter-tree
            :subject-entity="isWorks ? null : querySubjectEntity"
            :filters="query.filter_aggs"
            :is-sentence="true" />
          </template>

          <!-- Group Button -->
          <template v-else-if="uiVariant === 'sentence-group'">
            <!-- Entity Filters -->
            <query-filter-tree
              :subject-entity="isWorks ? null : querySubjectEntity"
              :filters="query.filter_aggs"
              :is-sentence="true" />

            <!-- Works Filters -->
            <query-filter-tree
              subject-entity="works"
              :isWithAggs="querySubjectEntity !== 'works'"
              :filters="query.filter_works"
              :is-sentence="true" />
          </template>

          <!-- Entity First -->
          <template v-else-if="uiVariant === 'sentence-entityfirst'">
            <!-- Entity Filters -->
            <query-filter-tree
              v-if="querySubjectEntity !== 'works'"
              :subject-entity="querySubjectEntity"
              :filters="query.filter_aggs"
              :is-sentence="true" />

            <!-- Works Filters -->
            <query-filter-tree
              subject-entity="works"
              :isWithAggs="querySubjectEntity !== 'works'"
              :filters="query.filter_works"
              :is-sentence="true" />
          </template>
        </div>

        <div class="sentence-buttons-box">
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <span v-bind="props">
                <query-outline-view class="mx-1"/>
              </span>
            </template>
            <span>Outline View</span>
          </v-tooltip>

          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <span v-bind="props">
                <new-query-button size="default" button-text="" variant="tonal" icon="mdi-refresh"/>
              </span>
            </template>
            <span>New Query</span>
          </v-tooltip>

        </div>
      </div>
      <query-search-controls v-if="hasQueryChanged || isSearchCanceled"/>
    </div>

    <div class="results-top-line">
      <query-results-count />
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import QueryFilterTree from '@/components/Query/QueryFilterTree.vue';
import QueryOutlineView from '@/components/Query/QueryOutlineView.vue';
import QueryResultsCount from '@/components/Query/QueryResultsCount.vue';
import QuerySearchControls from '@/components/Query/QuerySearchControls.vue';
import NewQueryButton from '@/components/Misc/NewQueryButton.vue';

defineOptions({
  name: 'QuerySentence',
});

const store = useStore();

const uiVariant = computed(() => store.getters['uiVariant']);
const query = computed(() => store.getters['search/query']);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);
const hasQueryChanged = computed(() => store.getters['search/hasQueryChanged']);
const isSearchCanceled = computed(() => store.getters['search/isSearchCanceled']);

const isWorks = computed(() => ['works', 'summary'].includes(querySubjectEntity.value));
</script>


<style>
.query-sentence-box {
  padding-bottom: 0px;
  display: flex;
  justify-content: space-between;
}
.query-sentence-container {
  margin-bottom: 20px;
}
.query-sentence-container.in-progress {
  border-radius: 5px;
  border: 1px solid #e0e0e0;
  background-color: #fafafa;
  padding: 10px;
}
.query-sentence {
  padding: 0px 10px 3px 3px; 
  max-width: 950px;
  line-height: 2;
  text-indent: -20px;
  margin-left: 20px;
} 
.query-sentence * {
  text-indent: 0;
}
.sentence-buttons-box {
  white-space: nowrap;
}
.sentence-buttons-box .v-btn {
  min-width: 20px !important;
  width: 28px;
}
.search-controls {
  padding: 10px 0px 0px 0px;
  margin-top: 15px;
  text-align: left;
  border-top: 1px solid #e0e0e0;
}
.results-top-line {
  display: flex;
}
.results-count-box {
  font-size: 12px;
  text-align: right;
  color: #444;
  height: 26px;
  padding: 0 0px;
  margin-top: 6px;
  margin-bottom: -3px;
  align-self: end;
  white-space: nowrap;
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  align-items: baseline;
}
.query-sentence .query-filter-tree,
.query-sentence .query-filter-tree > div,
.query-sentence .query-wrapper,
.query-sentence .query-filter-tree-branch,
.query-sentence .query-filter-leaf,
.query-sentence .query-section-label,
.query-sentence .leaf-content,
.query-sentence .bottom-button-wrapper,
.query-sentence .query-outline-view {
  display: inline !important;
  border: none;
  margin: 0;
  padding: 0;
}
.query-sentence .query-section-label,
.query-sentence .query-filter-leaf {
  white-space: nowrap;
}
.query-sentence .query-builder-input {
  display: inline-block !important;
  width: 250px;
  vertical-align: middle;
}
.query-sentence .path-label {
  margin-right: 0;
}
</style>
