<template>
  <span>
    <v-menu offset-y open-on-hover :close-on-content-click="false">
      <template v-slot:activator="{on}">
        <span
            v-on="on"
            class=""
            style="cursor: default;"
        >
          the {{ config.displayName }} is
        </span>
      </template>
      <v-card>
        <div class="pa-3 d-flex">
          <v-icon large left>{{ config.icon }}</v-icon>
          <div>
              <div class="text-capitalize text-h6">
                {{ config.displayName }}
            </div>
            <div class="body-2 grey--text">
              {{ filterKey }}

            </div>
          </div>
        </div>
        <v-card-actions>
              <v-spacer/>
                <v-btn icon @click="$store.state.activeFilter = filterKey">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn icon @click="deleteMe">
                  <v-icon>mdi-delete-outline</v-icon>
                </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

      <template v-for="(id, i) in optionIds">
        <filter-phrase-select-option
            :key="id"
            :filter-value="id"
            :filter-key="filterKey"
            @delete="deleteOption(id)"
        /><template v-if="optionIds.length > 1 && i < optionIds.length - 1"><filter-phrase-match-mode
          :filter-key="filterKey"/></template>

      </template>

    <span
        v-if="isActive"
        class="filter-phrase-select-suggest"
        style="position: relative; display: inline-block;"
    >
      <input
          type="text"
          v-if="isActive"
          v-model="searchString"
          :id="'input.' + filterKey"
          style=""
          @keydown.delete="onDelete"
          v-click-outside="onClickOutside"
      >
      <v-card style="position: absolute;">
        <div
            v-for="option in unselectedOptions"
            :key="'unselected' + option.id"
            @click="addOption(option.id)"
            class="d-flex pa-2 suggestion"
        >
          <v-icon left>mdi-plus</v-icon>
          <span>
            {{ option.display_name }}
          </span>
        </div>
      </v-card>

    </span>


    <!--          @toggle-is-negated="toggleOptionIsNegated(id)"-->

  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import FilterPhraseSelectOption from "@/components/FilterPhrase/FilterPhraseSelectOption.vue";
import FilterOptionChip from "@/components/Filters/FilterOptionChip.vue";
import {makeSelectFilterValue} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import FilterPhraseMatchMode from "@/components/FilterPhrase/FilterPhraseMatchMode.vue";
import {filter} from "core-js/internals/array-iteration";

export default {
  name: "Template",
  components: {
    FilterOptionChip,
    FilterPhraseSelectOption,
    FilterPhraseMatchMode,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      isLoading: false,
      unselectedOptions: [],
      maxUnselectedOptionsCount: 10,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isActive() {
      return this.$store.state.activeFilter === this.filterKey
    },
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    isMatchModeAnd: {
      get() {
        return this.filterValue?.includes("+")
      },
      set(to) {
        const matchModeString = to ? "all" : "any"
        const newValue = makeSelectFilterValue(this.appliedOptionIds, matchModeString)
        this.$emit("upsert", newValue)
      }
    },
    optionIds: {
      get() {
        return url.readFilterOptions(this.entityType, this.filterKey)
      },
      set(to) {
        console.log("set appliedOptionIds", to)

        const isMatchModeAnd = to.some(id => id.includes("!")) ?
            true :
            this.isMatchModeAnd
        const matchModeString = isMatchModeAnd ? "all" : "any"

        const newValue = makeSelectFilterValue(to, matchModeString)
        this.$emit("upsert", newValue)
      }
    },
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      console.log("FilterPhraseSelect submit()")
    },
    onDelete() {
      console.log("FilterPhraseSelect onDelete()")

    },
    onClickOutside() {
      console.log("FilterPhraseSelect onClickOutside()")
      if (this.filterKey === this.$store.state.activeFilter) {
        this.$store.state.activeFilter = null
      }

    },

    deleteOption(id) {
      this.optionIds = this.optionIds.filter(i => i !== id)
    },
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },

    addOption(id) {
      url.addFilterOption(this.entityType, this.filterKey, id)
    },
    async fetchOptions() {
      this.isLoading = true
      try {
        const apiOptions = await api.getAutocompleteResponses(
            this.entityType,
            this.filterKey,
            this.searchString,
        )

        // const newOptions = apiOptions.filter(myNewOption => {
        //   const oldOptionIds = this.options.map(o => o.id)
        //   return !oldOptionIds.includes(myNewOption.id)
        // })
        this.unselectedOptions = apiOptions.filter(o => {
          const iAmInSelectedOptions = this.optionIds.find(appliedId => {
            return appliedId === o.id
          })
          return !iAmInSelectedOptions
        }).slice(0, this.maxUnselectedOptionsCount)

      } catch (e) {
        console.log("fetchOptions() error:", e.message)
      } finally {
        this.isLoading = false
      }
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    },
  }
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}

.filter-phrase-select-suggest {
  .suggestion {
    cursor: default;

    &:hover {
      background: #fafafa;
    }
  }
}

</style>