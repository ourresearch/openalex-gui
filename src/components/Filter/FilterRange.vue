<template>
  <v-col cols="12" lg="4" xl="3">
    <v-card
        rounded
        flat
        class="filter fill-height d-flex flex-column"
        @click="isActive = true"
    >
      <div class="d-flex pa-2 pb-1 align-center">
        <v-icon left>{{ config.icon }}</v-icon>
        <span>{{ config.displayName }}</span>
        <v-spacer/>
        <v-btn class="ml-1" small icon @click="$emit('delete')">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </div>


      <div class="d-flex pa-2">
        <v-icon left>mdi-pencil-outline</v-icon>
        <span class="font-weight-bold">{{ value }}</span>

      </div>
    </v-card>

    <v-dialog rounded v-model="isActive" max-width="600">
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
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text rounded @click="isActive = false">Cancel</v-btn>
          <v-btn color="primary" rounded @click="submit">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


  </v-col>


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

export default {
  name: "FilterValueSearch",
  components: {
    FilterMatchMode,
    EditPhraseSearch,
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