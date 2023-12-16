<template>
  <div class="filter-select-add-option" style="display: inline-block;">
    <v-text-field
        prepend-inner-icon="mdi-magnify"
        class=" pa-0 ml-2"
        style="font-size: 20px;"
        v-model="searchString"
        autofocus
        hide-details
        @blur="onBlur"
    />
    <v-card class="suggestions-box">
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
    </v-card>
  </div>
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
      if (url.isFilterApplied(this.entityType, this.filterKey)) {
        url.addFilterOption(this.entityType, this.filterKey, id)
      }
      else {
        url.createFilter(this.entityType, this.filterKey, id)
      }
    },
    onBlur(){
      setTimeout(()=> {
        this.$emit("blur")
      }, 100)
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

.filter-select-add-option {
  position: relative;
  .suggestions-box {
    position: absolute;
    z-index: 9;
    .suggestion {
      cursor: default;
      font-size: 16px;

      &:hover {
        background: #fafafa;
      }
    }

  }
}

</style>