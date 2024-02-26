<template>
  <filter-base :filter-key="filterKey" :index="index" @click="isActive = true" clickable>
    <td>
        {{ value }}

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
    </td>
  </filter-base>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs, getFacetConfig} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import Template from "@/components/Filter/FilterSelect.vue";


import {filter} from "core-js/internals/array-iteration";
import TryChips from "@/components/TryChips.vue";
import FilterBase from "@/components/Filter/FilterBase.vue";

export default {
  name: "FilterValueRange",
  components: {
    TryChips,
    FilterBase,
  },
  props: {
    filterKey: String,
    index: Number,
  },
  data() {
    return {
      foo: 42,
      isActive: false,
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    value: {
      get() {
        return url.readFilterValue(this.$route, this.$store.state.entityType, this.index)
      },
      set(to) {
        console.log("FilterRange value set()", to)
        this.value ?
            url.updateOrDeleteFilter(this.entityType, this.index, to) :
            url.createFilter(this.entityType, this.filterKey, to)
      }
    }
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      this.$emit("close") // i don't get why this is necessary
      this.isActive = false
      this.value = this.searchString
    },


  },
  created() {
  },
  mounted() {
    this.searchString = this.value
    this.isActive = !this.value
  },
  watch: {
    isActive(to) {
      if (!to) this.$emit("close")
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