<template>
  <div class="flex items-baseline">
    <Textarea
        v-model="queryOql"
        placeholder="OQL query"
        rows="1"
        @keydown.ctrl.enter="createSearchFromOql(queryOql)"
        @keydown.meta.enter="createSearchFromOql(queryOql)"
    />
    <Button size="icon" class="ml-2">
      <ArrowDownCircle class="h-6 w-6" />
    </Button>
  </div>
</template>


<script setup>
import { useStore } from "vuex";
import { computed } from "vue";

import { ArrowDownCircle } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

defineOptions({ name: "QueryOql"});

const store = useStore();

const queryOql = computed(() => store.getters["search/queryOql"]);
</script>