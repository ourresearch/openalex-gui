<template>
  <div class="d-flex align-baseline">
    <v-textarea
        v-model="queryOql"
        label="OQL query"
        rounded
        variant="filled"
        rows="1"
        auto-grow
        clearable
        @keydown.ctrl.enter="createSearchFromOql(queryOql)"
        @keydown.meta.enter="createSearchFromOql(queryOql)"
    />
    <v-btn
        color="primary"
        icon
        size="large"
        class="ml-2"
    >
      <v-icon size="large">mdi-arrow-down-circle</v-icon>
    </v-btn>
  </div>
</template>


<script setup>
import { useStore } from "vuex";
import { computed } from "vue";

defineOptions({ name: "QueryOql"});

const store = useStore();

const queryOql = computed(() => store.getters["search/queryOql"]);
</script>