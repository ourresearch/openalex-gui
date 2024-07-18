<template>
  <div>
    <v-textarea
        v-model="query"
        label="OQL"
        outlined
        clearable
        auto-grow
        rounded
        rows="5"
        placeholder="Enter your OQL here"
        @keydown.ctrl.enter="search"
        @keydown.meta.enter="search"
    >
    </v-textarea>
    <div class="d-flex justify-center">
      <v-btn x-large color="primary" rounded @click="search">
        <v-icon left>mdi-magnify</v-icon>
        Search
      </v-btn>
    </div>
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
      query: "",
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),

  },

  methods: {
    ...mapMutations([
      "snackbar",

    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    async search(){
      const newRoute = {name: "results", query: {q: this.query}}
      await this.$router.push(newRoute)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.q": {
      handler: function (value) {
        this.query = value
      },
      immediate: true
    }
  }
}
</script>

<style scoped lang="scss">

</style>