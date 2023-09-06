<template>
  <v-dialog scrollable v-model="isOpen" max-width="800px">

    <v-card>
      <v-toolbar>
        <v-toolbar-title>
          <v-icon left>mdi-filter-plus-outline</v-icon>
          Add Filter
        </v-toolbar-title>
        <v-spacer/>
        <v-text-field
            v-model="searchString"
            clearable
            dense
            outlined
            hide-details
            prepend-inner-icon="mdi-magnify"
            label="Search all filters"
        />

        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </v-toolbar>
      <v-navigation-drawer style="top:64px;" absolute>
        <v-list-item-group v-model="selectedCategory">
          <v-list-item
              v-for="(categoryName, i) in categoryNames"
              :key="categoryName"
          >
            <v-list-item-icon>
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              {{ categoryName }}
            </v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-navigation-drawer>
      <!--    <div class="pl-3 pt-2">Select filter:</div>-->
      <!--    <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">-->
      <v-card-text style="height: 90vh;">

        <v-row>
          <v-col cols="6">

          </v-col>
          <v-col cols="6">

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
          </v-col>

        </v-row>
      </v-card-text>

    </v-card>
  </v-dialog>
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
      selectedCategory: 0,
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
      return _.cloneDeep(facetCategories)[this.entityType]
    },
    selectedCategoryName() {
      return this.categoryNames[this.selectedCategory]
    },
    filterOptions() {
      return filtersList(this.entityType, [], this.searchString)
          .filter(f => {
            const thisFilterIsUnpinnable = !["boolean", "select"].includes(f.type);
            return !(this.hideUnpinnable && thisFilterIsUnpinnable)
          })
          .filter(f => {
            if (!this.selectedCategory) return true
            return f.categories.includes(this.selectedCategoryName)
          })
    },
    topFilters() {
      return filtersList(this.entityType, [], "").filter(f => {
        return f.category === "popular"
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