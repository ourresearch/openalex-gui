<template>
  <div class="d-flex align-center flex-grow-1">
    <v-menu rounded offset-y>
      <template v-slot:activator="{ on }">
        <v-btn
            text
            v-on="on"
            color="primary"
            class="px-1"
        >
          add a {{ nthFilter }} filter
        </v-btn>
      </template>
      <v-card flat rounded>
        <v-text-field
            v-model="search"
            filled
            rounded
            background-color="white"
            prepend-inner-icon="mdi-magnify"
            hide-details
            autofocus
            placeholder="Search filters"
            style=""
        />
        <v-divider/>

        <v-list class="py-0" style="max-height: calc(50vh - 56px); overflow-y: scroll;">
          <v-list-item
              v-if="'subquery multiple'.includes(search.toLowerCase())"
              @click="$emit('addBranchFilter', filter.id)"
          >
            <v-list-item-icon>
              <v-icon>mdi-filter-multiple-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Subquery
                <span class="grey--text">(multiple filters)</span>
              </v-list-item-title>
<!--              <v-list-item-subtitle>-->
<!--                Group multiple filters together-->
<!--              </v-list-item-subtitle>-->
            </v-list-item-content>
          </v-list-item>
<!--          <v-divider/>-->
<!--          <v-subheader>-->
<!--            Individual filters:-->
<!--          </v-subheader>-->
          <v-list-item
              v-for="column in newFilterColumnOptions"
              :key="column.id"
              @click="$emit('addLeafFilter', { buttonId: filter.id, columnId: column.id })"
          >
            <v-list-item-icon>
              <v-icon>{{ column.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              {{ column.displayName }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {ordinalize} from "../../util";

export default {
  name: "Template",
  components: {},
  props: {
    filter: Object,
  },
  data() {
    return {
      foo: 42,
      search: "",
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
    newFilterColumnOptions() {
      return Object.values(getConfigs()["works"].columns).filter( f => {
        return f.displayName.toLowerCase().includes(this.search.toLowerCase())
      })
    },
    nthFilter() {
      return ordinalize(this.filter.siblingIndex + 1)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
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