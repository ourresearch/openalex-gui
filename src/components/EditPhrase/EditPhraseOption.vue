<template>
  <span>
    <v-dialog
        v-model="isOpen"
        max-width="800"
    >
      <v-card rounded>

        <v-text-field
            class="text-h5 pb-2"
            v-model="searchString"
            autofocus
            rounded
            clearable
            hide-details
            @keydown.enter="submit"
        >
          <template v-slot:prepend-inner>
            <span style="padding-top: 0px;" class="grey--text">
            {{ myFilterConfig.displayName }}
            </span>
          </template>
        </v-text-field>
        <div class="filter-phrase-select-suggest">
          <div
            v-for="option in options"
            :key="'unselected' + option.id"
            @click="addOption(option.id)"
            class="d-flex pa-2 suggestion"
        >
          <v-icon left>mdi-plus</v-icon>
          <span>
            {{ option.display_name }}
          </span>
        </div>
        </div>
      </v-card>
     </v-dialog>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import {url} from "@/url";
import {api} from "@/api";

export default {
  name: "Template",
  components: {},
  props: {
    value: Boolean,
    filterKey: String,
    option: String,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      loading: false,
      options: [],
      maxUnselectedOptionsCount: 10,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    isOpen: {
      get() {
        return this.value
      },
      set(to) {
        this.$emit("input", to)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      url.upsertFilter(
          this.entityType,
          this.filterKey,
          this.searchString
      )
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
        const selectedOptions = url.readFilterOptions(this.entityType, this.filterKey)
        this.options = apiOptions.filter(o => {
          const iAmInSelectedOptions = selectedOptions.find(appliedId => {
            return appliedId === o.id
          })
          return !iAmInSelectedOptions
        }).slice(0, this.maxUnselectedOptionsCount)

      } catch (e) {
        console.log("fetchOptions() error:", e.message)
      } finally {
        this.isLoading = false
      }
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
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    },
    isOpen: {
      immediate: true,
      handler(to, from) {
      }
    }
  }
}
</script>

<style scoped lang="scss">

.filter-phrase-select-suggest {
  .suggestion {
    cursor: default;

    &:hover {
      background: #fafafa;
    }
  }
}

</style>