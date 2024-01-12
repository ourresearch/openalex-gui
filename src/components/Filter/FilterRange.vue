<template>
  <v-card
      rounded
      flat
      class="filter button-card d-flex align-center py-1 px-2 mr-2 mb-2"
      @click="isActive = true"

  >
    <div class="pl-2 pr-4">
      <v-icon>{{ config.icon }}</v-icon>
    </div>
    <div class="">
      <div class="caption">
        The {{ config.displayName}} is
      </div>
      <span class="font-weight-bold">
        {{ value }}
      </span>

    </div>
    <div class="pl-2 pr-0">
      <v-btn class="" icon @click="$emit('delete')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <v-dialog
        rounded
        v-model="isActive"
        max-width="600"
        @keydown.enter="submit"
    >
      <v-card rounded>
        <v-toolbar flat>
          <v-toolbar-title>
            {{ config.displayName }}
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="isActive = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="pa-2">
          <v-text-field
              style="width: 100%;"
              rounded
              outlined
              full-width
              v-model="searchString"
              hide-details
              @keydown.enter="submit"
              autofocus
          >
          </v-text-field>
          <try-chips
              :ideas="['2023', '2020-', '2020-2024', '-2020']"
              @select="idea => searchString = idea"
          />

        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text rounded @click="isActive = false">Cancel</v-btn>
          <v-btn color="primary" rounded @click="submit">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import Template from "@/components/Filter/FilterSelect.vue";


import EditPhraseSearch from "@/components/EditPhrase/EditPhraseSearch.vue";
import {filter} from "core-js/internals/array-iteration";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";
import TryChips from "@/components/TryChips.vue";

export default {
  name: "FilterValueSearch",
  components: {
    FilterMatchMode,
    EditPhraseSearch,
    TryChips,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      isDialogOpen: false,
      value: url.readFilterValue(this.$store.state.entityType, this.filterKey),
      searchString: url.readFilterValue(this.$store.state.entityType, this.filterKey),
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    isActive: {
      get() {
        return this.$store.state.activeFilterKey === this.filterKey
      },
      set(to) {
        this.$store.state.activeFilterKey = (to) ?
            this.filterKey :
            undefined
      }
    }
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },
    submit() {
      url.upsertFilter(
          this.entityType,
          this.filterKey,
          this.searchString
      )
      this.$store.state.activeFilter = null
      this.$emit("submit")
    },
    onClickOutside() {
      if (this.filterKey === this.$store.state.activeFilter) {
        this.$store.state.activeFilter = null
      }
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler: function (to, from) {
      }
    }
  }
}
</script>

<style lang="scss">
input {
  padding: 0 3px !important;
}

.phrase-search {

}

input:focus, textarea:focus, select:focus {
  //outline: none;
}

</style>