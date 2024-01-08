<template>
  <v-list-item
    :to="author.author.id | entityZoomLink"
  >
    <v-list-item-icon>
      <v-icon>mdi-account-outline</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        {{ author.author.display_name }}
        <span class="grey--text" v-if="author.is_corresponding">(corresponding)</span>
      </v-list-item-title>
      <v-list-item-subtitle>
        <span
          v-for="(insti, i) in author.institutions"
          :key="insti.id"
        >
          {{ insti.display_name }}{{ (i < author.institutions.length - 1) ? ',' : ''}}
        </span>
      </v-list-item-subtitle>

    </v-list-item-content>

  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "EntityWorkSource",
  components: {},
  props: {
    author: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


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