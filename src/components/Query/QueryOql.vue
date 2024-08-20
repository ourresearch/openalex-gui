<template>
  <div class="d-flex align-baseline">
    <v-textarea
        v-model="oql"
        label="OQL query"
        rounded
        filled
        rows="1"
        auto-grow
        clearable
        @keydown.ctrl.enter="createSearchFromOql(oql)"
        @keydown.meta.enter="createSearchFromOql(oql)"

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

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      oql: "",
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "returnedEntityType"
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "createSearchFromOql",
    ]),
    ...mapActions("user", []),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$store.state.search.id": {
      handler: function (val) {
        console.log("QueryOql.vue: watch: $store.state.search.id: val: ", val)
      },
      deep: true,
    }
  }
}
</script>

<style scoped lang="scss">

</style>