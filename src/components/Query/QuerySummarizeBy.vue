<template>
  <span>
    <v-menu>
      <template v-slot:activator="{ on }">
        <v-chip
            label
            v-on="on"
            :color="query.summarize_by ? 'primary' : null"
        >
          by
          <template v-if="!query.summarize_by">...</template>
          <template v-else>{{ query.summarize_by }}</template>
        </v-chip>
      </template>
      <v-list>
        <v-list-item-group v-model="$store.state.search.query.summarize_by">
          <v-list-item
              v-for="entity in entities"
              :key="entity.id"
              @click="query.summarize_by = entity.id"
              :value="entity.id"
              active-class="primary--text"
          >
            <v-list-item-icon>
              <v-icon>{{ entity.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ entity.displayName }}</v-list-item-title>
            <v-list-item-icon v-if="query.summarize_by === entity.id">
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>

        </v-list-item-group>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {oaxConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
        "query",
    ]),
    entities() {
      return Object.values(oaxConfigs)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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