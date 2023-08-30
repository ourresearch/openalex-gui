<template>
  <v-card max-height="90vh">
    <v-text-field
        v-model="searchString"
        autofocus
        clearable
        hide-details
        class="mx-2"
        prepend-inner-icon="mdi-magnify"
    />
    <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">
      <v-list>
        <v-list-item
            v-for="filter in filterOptions"
            :key="filter.key"
            @click="$emit('select', filter.key)"
        >
          {{ filter.displayName }}
        </v-list-item>
      </v-list>

    </div>

  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {filtersList} from "@/facetConfigs";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filterOptions() {
      return filtersList(this.entityType, [], this.searchString)
    }
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