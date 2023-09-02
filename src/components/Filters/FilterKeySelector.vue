<template>
  <v-card :dark="dark" max-height="90vh">
    <div class="pl-3 pt-2">Select filter:</div>
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
            :disabled="disabledKeys.includes(filter.key)"
            v-for="filter in filterOptions"
            :key="filter.key"
            @click="$emit('select', filter.key)"
        >
          <v-list-item-icon>
            <v-icon>{{ filter.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ filter.displayName }}
            </v-list-item-title>
          </v-list-item-content>
<!--          <v-list-item-action>-->
<!--            <v-btn :disabled="filter.type.includes('boolean', 'select')" icon @click.stop="$emit('pin', filter.key)">-->
<!--              <v-icon>mdi-pin-outline</v-icon>-->
<!--            </v-btn>-->
<!--          </v-list-item-action>-->
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
  props: {
    dark: Boolean,
    hideUnpinnable: Boolean,
    disabledKeys: {
      type: Array,
      default() {
        return []
      },
    },
  },
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
      return filtersList(this.entityType, [], this.searchString).filter(f => {
        const thisFilterIsUnpinnable = !["boolean", "select"].includes(f.type);
        return !(this.hideUnpinnable && thisFilterIsUnpinnable)
      })
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