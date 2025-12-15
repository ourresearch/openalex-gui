<template>
  <span class="query-outline-view">
    <!-- Button that opens the dialog -->
    <Button variant="secondary" size="default" class="query-outline-button" @click="openDialog">
      <List class="h-5 w-5" />
    </Button>

    <!-- Dialog component -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-w-[600px] query-builder">
        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="outline" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">Outline</TabsTrigger>
            <TabsTrigger value="json" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">JSON</TabsTrigger>
            <TabsTrigger value="oql" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">OQL</TabsTrigger>
            <TabsTrigger value="sql" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">SQL</TabsTrigger>
          </TabsList>

          <TabsContent value="outline">
            <div class="p-6 pb-0">
              <template v-if="uiVariant === 'sentence-worksfirst'">
                <query-filter-tree
                  subject-entity="works"
                  :isWithAggs="querySubjectEntity !== 'works'"
                  :filters="query.filter_works" />

                <query-filter-tree
                  :subject-entity="querySubjectEntity === 'works' ? null : querySubjectEntity"
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
            <div class="flex justify-end gap-2 p-4">
              <Button variant="ghost" @click="cancelClick">Cancel</Button>
              <Button @click="searchClick">Search</Button>
            </div>
          </TabsContent>

          <TabsContent value="json">
            <div class="p-4"><pre class="text-sm">{{ query }}</pre></div>
          </TabsContent>

          <TabsContent value="oql" class="p-4">
            <search-from-text :disabled="!queryIsCompleted" />
          </TabsContent>

          <TabsContent value="sql">
            <div class="p-4"><pre class="sql text-sm whitespace-pre-wrap overflow-x-auto">{{ formattedSql }}</pre></div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  </span>
</template>


<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { format } from "sql-formatter";

import { List } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryColumnsControls from "@/components/Query/QueryColumnsControls.vue";
import SearchFromText from "@/components/SearchFromText.vue";

defineOptions({ name: "QueryOutlineView" });

const store = useStore();

const dialogOpen = ref(false);
const activeTab = ref(0);

const uiVariant = computed(() => store.getters["uiVariant"]);
const query = computed(() => store.getters["search/query"]);
const querySubjectEntity = computed(() => store.getters["search/querySubjectEntity"]);
const queryIsCompleted = computed(() => store.getters["search/queryIsCompleted"]);
const querySql = computed(() => store.getters["search/querySql"]);

const formattedSql = computed(() => {
  const rawSql = querySql.value;
  if (!rawSql) return "";
  return format(rawSql, { language: "redshift" });
});

function openDialog() {
  dialogOpen.value = true;
}

function cancelClick() {
  store.dispatch("search/resetToSubmittedQuery");
  dialogOpen.value = false;
}

function searchClick() {
  store.dispatch("search/createSearch");
  dialogOpen.value = false;
}
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
