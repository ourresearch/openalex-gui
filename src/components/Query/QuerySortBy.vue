<template>
  <span>
    <v-menu>
      <template v-slot:activator="{ on }">
        <v-chip
            label
            v-on="on"
        >

          Sort by {{ query.sort_by.column_id }}
        </v-chip>
      </template>
      <v-list>
        <v-list-item-group
            v-model="$store.state.search.query.sort_by.column_id"
        >
          <v-list-item
              v-for="option in options"
              :key="option.id"
              :value="option.id"
              active-class="primary--text"
          >
            <v-list-item-icon>
              <v-icon>{{ option.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ option.displayName }}</v-list-item-title>
            <!--            <v-list-item-icon v-if="query.summarize_by === entity.id">-->
            <!--              <v-icon>mdi-check</v-icon>-->
            <!--            </v-list-item-icon>-->
          </v-list-item>

        </v-list-item-group>
      </v-list>
    </v-menu>
    <v-chip
      class="ml-1"
      label
      @click="toggleSortByDirection"
    >
      <v-icon left small>{{ iconName }}</v-icon>
      {{ query.sort_by.direction }}
    </v-chip>
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
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
    options() {
      return Object.values(oaxConfigs["works"].columns).filter(col => {
        return col.actions.includes("sort")
      })
    },
    iconName(){
      return this.query.sort_by.direction === "asc" ? "mdi-sort-ascending" : "mdi-sort-descending"
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
      "toggleSummarize",
      "toggleSortByDirection",
    ]),
    ...mapActions("search", []),
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