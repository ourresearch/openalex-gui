<template>
    <v-card>
      <v-divider />
<!--      <div-->
<!--          style="top:64px; width: 200px; position: absolute;-->
<!--          z-index: 0;"-->
<!--      >-->
      <v-navigation-drawer absolute width="180" >
        <v-divider></v-divider>
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

      </v-navigation-drawer>
<!--      </div>-->
      <!--    <div class="pl-3 pt-2">Select filter:</div>-->
      <!--    <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">-->
      <v-card-text
          style="height: 80vh; padding-left: 210px; overflow-y: scroll;"
      >

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
                <!--          <v-list-item-action>-->
                <!--            <v-btn :disabled="filter.type.includes('boolean', 'select')" icon @click.stop="$emit('pin', filter.key)">-->
                <!--              <v-icon>mdi-pin-outline</v-icon>-->
                <!--            </v-btn>-->
                <!--          </v-list-item-action>-->
              </v-list-item>
            </v-list>
      </v-card-text>

    </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetCategories, filtersList} from "@/facetConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    value: Boolean,
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
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    select(filterKey){
      this.$emit('select', filterKey)
      this.$emit('close')
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from){
      this.searchString = ""
      this.selectedCategory = 1
    },
    searchString(to, from){
      if (to) {
        this.selectedCategory = 0
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>