<template>
  <div class="d-flex align-baseline">
    <v-textarea
        v-model="queryOql"
        label="OQL query"
        rounded
        filled
        rows="1"
        auto-grow
        clearable
        @keydown.ctrl.enter="createSearchFromOql(queryOql)"
        @keydown.meta.enter="createSearchFromOql(queryOql)"
    />
    <v-btn
        color="primary"
        icon
        large
        class="ml-2"
    >
      <v-icon large>mdi-arrow-down-circle</v-icon>
    </v-btn>
  </div>
</template>


<script>

import {mapGetters} from "vuex";

export default {
  name: "QueryOql",
  components: {},
  props: {},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("search",[
      'queryOql',
    ]),
  },
}
</script>


<style scoped lang="scss">

</style>