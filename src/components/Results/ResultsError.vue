<template>
  <div class="table-meta d-flex align-center pa-8"  style="height: 140px;">
  <span>
  <b>Search error:</b> {{queryBackendError}}
  </span>
  </div>
</template>


<script setup>

import {computed} from "vue";
import {useStore} from "vuex";

defineOptions({ name: "ResultsError" });

const store = useStore();
const queryBackendError = computed(() => store.getters["search/queryBackendError"]);

</script>