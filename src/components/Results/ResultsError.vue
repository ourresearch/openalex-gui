<template>
  <div class="table-meta d-flex align-center pa-8"  style="height: 140px;">
  <span>
  <b>Search error:</b> {{queryBackendError}}
  </span>
  </div>
</template>

<script>

import {mapGetters} from "vuex";

export default {
  name: "ResultsError",
  computed: {
    ...mapGetters([
      "queryBackendError",
    ]),
  }
}
</script>


<style scoped lang="scss">

</style>