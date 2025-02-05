<template>
  <div>
    <div class="text-h4 ml-1">My Searches</div>

    <v-card rounded outlined class="my-4">

      <v-alert type="warning" icon="mdi-progress-wrench">
        Support for saved searches will be coming soon.
      </v-alert>   

      <v-card-text>You don't have any saved searches yet.</v-card-text>

    </v-card>

  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "MeSearches",
  components: {
  },
  props: {},
  data() {
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
  },
  methods: {
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>


<style scoped lang="scss">

</style>