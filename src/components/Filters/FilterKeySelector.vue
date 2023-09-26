<template>
  <v-card flat tile>
    <v-list expand :dense="dense" style="">
      <v-list-group
          v-for="category in facetsByCategory"
          :key="category.displayName"
          :value="!!searchString"
      >
        <template v-slot:activator>
          <v-list-item-icon>
            <v-icon>{{ category.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ category.displayName }}</v-list-item-title>
          </v-list-item-content>
        </template>
        <v-list-item
            class="pl-12"
            v-for="filterConfig in category.filterConfigs"
            :key="category.displayName + filterConfig.key"
            @click="select(filterConfig.key)"
            :disabled="disabledKeys.includes(filterConfig.key)"
        >
          <v-list-item-icon>
            <v-icon :disabled="disabledKeys.includes(filterConfig.key)">{{ filterConfig.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ filterConfig.displayName }}
            </v-list-item-title>
<!--            <v-list-item-subtitle :class="{'grey&#45;&#45;text': disabledKeys.includes(filterConfig.key)}">-->
<!--              {{ filterConfig.type }}-->
<!--            </v-list-item-subtitle>-->
          </v-list-item-content>
        </v-list-item>

      </v-list-group>
    </v-list>




  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetCategories, facetConfigs, facetsByCategory} from "@/facetConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    value: Boolean,
    dark: Boolean,
    hideUnpinnable: Boolean,
    dense: Boolean,

    searchString: {
      type: String,
      default() {
        return ""
      },
    },
    includeOnlyTypes: {
      type: Array,
      default() {
        return []
      },
    },
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
      selectedCategory: 1,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isOpen: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('close')
      }
    },
    facetsByCategory() {
      return facetsByCategory(this.entityType, this.searchString, this.includeOnlyTypes)
    },
  },

  methods: {
    facetConfigs,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    select(filterKey) {
      this.$emit('select', filterKey)
      this.$emit('close')
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
      this.selectedCategory = 1
    },
  }
}
</script>

<style scoped lang="scss">

</style>