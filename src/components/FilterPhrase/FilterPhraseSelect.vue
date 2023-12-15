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
                <v-btn icon @click="isEditOpen = true">
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



    <!--          @toggle-is-negated="toggleOptionIsNegated(id)"-->

    <edit-phrase-option
      v-model="isEditOpen"
      :filter-key="filterKey"
      :option="undefined"
    />

  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import FilterPhraseSelectOption from "@/components/FilterPhrase/FilterPhraseSelectOption.vue";
import {makeSelectFilterValue} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import FilterPhraseMatchMode from "@/components/FilterPhrase/FilterPhraseMatchMode.vue";
import {filter} from "core-js/internals/array-iteration";

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";

export default {
  name: "Template",
  components: {
    FilterPhraseSelectOption,
    FilterPhraseMatchMode,

    EditPhraseOption,
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

      isEditOpen: false,
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



  },
  created() {
  },
  mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}


</style>