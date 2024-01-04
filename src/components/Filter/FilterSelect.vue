<template>
  <v-col cols="12" lg="4" xl="3">
    <v-card rounded flat class="filter">
      <div class="d-flex pa-2 pb-1 align-center">
        <v-icon left>{{ config.icon }}</v-icon>
        <span>{{ config.displayName }}</span>
        <v-spacer/>
        <filter-match-mode
            v-if="optionIds.length > 1"
            :filter-key="filterKey"
        />
        <v-btn class="ml-1" small icon @click="isEditMode = true">
          <v-icon small>mdi-plus</v-icon>
        </v-btn>
        <v-btn class="ml-1" small icon @click="$emit('delete')">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </div>
<!--      <v-divider />-->
      <div class="pa-3 pt-1 d-flex">
        <filter-select-option
            class="mb-1 mr-1 d-block"
            v-for="(id, i) in optionIds"
            :key="id"
            :filter-value="id"
            :filter-key="filterKey"
            :match-mode="url.readFilterMatchMode(entityType, filterKey)"
            :position="i"
            @delete="deleteOption(id)"
        />

        <span>
        <span v-if="isEditMode">
          <span v-if="optionIds.length">
            {{ url.readFilterMatchMode(entityType, filterKey) === 'all' ? 'and' : 'or' }}
          </span>
          <!--          <v-text-field-->
          <!--              class="text-h5 pa-0  ml-2"-->
          <!--              style="display: inline-block"-->
          <!--              v-model="searchString"-->
          <!--              hide-details-->
          <!--              autofocus-->
          <!--              @keydown.enter="submit"-->
          <!--              @blur="isEditMode = false"-->
          <!--          />-->

          <filter-select-add-option
              @submit="submit"
              :filter-key="filterKey"
              @blur="isEditMode = false"
          />

        </span>
      </span>
      </div>


      <!--      <template v-if="optionIds.length > 1 && i < optionIds.length - 1">-->
      <!--        <filter-phrase-match-mode-->
      <!--            :filter-key="filterKey"/>-->
      <!--      </template>-->


      <!--          @toggle-is-negated="toggleOptionIsNegated(id)"-->

    </v-card>
  </v-col>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import FilterSelectOption from "@/components/Filter/FilterSelectOption.vue";
import {makeSelectFilterValue} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import {filter} from "core-js/internals/array-iteration";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";

export default {
  name: "Template",
  components: {
    FilterSelectOption,
    FilterMatchMode,
    FilterSelectAddOption,

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

      isEditMode: false,
      url,
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
    optionIds: {
      immediate: true,
      handler(to, from) {
        if (!to?.length) this.isEditMode = true
      }
    }
  }
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}


</style>