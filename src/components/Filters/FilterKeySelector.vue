<template>
  <v-card flat tile>
    <v-list expand :dense="dense" style="height: 80vh; overflow-y: scroll;">
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
        >
          <v-list-item-icon>
            <v-icon>{{ filterConfig.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ filterConfig.displayName }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ filterConfig.type }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-icon>mdi-chevron-right</v-icon>
          </v-list-item-action>
        </v-list-item>

      </v-list-group>
    </v-list>


    <v-row v-if="0" style="height: 80vh; overflow-y: scroll;">
      <v-col cols="4">
        <v-list nav dense class="pt-6">
          <v-list-item-group nav v-model="selectedCategory" mandatory>
            <v-list-item

                v-for="(categoryName, i) in categoryNames"
                :key="categoryName"
            >
              <v-list-item-icon>
                <!--              <v-icon>mdi-check</v-icon>-->
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ categoryName }}
                </v-list-item-title>


              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>

        </v-list>

      </v-col>
      <v-col cols="8">
        <v-list class="mt-0 pt-0">
          <v-list-item
              :disabled="disabledKeys.includes(filter.key)"
              v-for="filter in filterOptions"
              :key="filter.key"
              @click="select(filter.key)"
          >
            <v-list-item-icon>
              <v-icon>{{ filter.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ filter.displayName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ filter.type }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-icon>mdi-chevron-right</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>


  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetCategories, facetConfigs, facetsByCategory, filtersList} from "@/facetConfigs";

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
    categoryNames() {
      const categoryNames = _.cloneDeep(facetCategories)[this.entityType]
      return ["all", ...categoryNames]
    },
    selectedCategoryName() {
      return this.categoryNames[this.selectedCategory]
    },
    filterOptions() {
      return filtersList(this.entityType, [], this.searchString)
          .map(f => {
            return {
              ...f,
              categories: [...f.categories, "all"]
            }
          })
          .filter(f => {
            const thisFilterIsUnpinnable = !["boolean", "select"].includes(f.type);
            return !(this.hideUnpinnable && thisFilterIsUnpinnable)
          })
          .filter(f => {
            // if (!this.selectedCategory) return true
            return f.categories.includes(this.selectedCategoryName)
          })
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