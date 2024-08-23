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
        @keydown.ctrl.enter="setSearchFromOql(oql)"
        @keydown.meta.enter="setSearchFromOql(oql)"

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
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "setSearchFromOql",
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
      },
      deep: true,
    }
  }
}
</script>

<style scoped lang="scss">

</style>