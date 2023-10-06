<template>
  <v-menu rounded>
    <template v-slot:activator="{on}">
      <v-chip
          close
          outlined
          @click:close="$emit('delete')"
          v-on="on"
          class="mr-1 mb-1"
      >

        <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
        <template v-if="filterDisplayValue">
          {{ filterDisplayValue | truncate(590) }}
        </template>
        <template v-else>
          Loading...
        </template>
      </v-chip>
    </template>
    <v-card rounded>
      <v-card-title>
        {{ filterDisplayValue }}
      </v-card-title>
      <v-card-subtitle>
        dude
      </v-card-subtitle>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          rounded
        >
          <v-icon left>mdi-information-outline</v-icon>
          Learn more
        </v-btn>
        <v-btn
          text
          rounded
        >
          <v-icon left>mdi-minus-circle</v-icon>
          Negate
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {isOpenAlexId} from "@/util";

export default {
  name: "FilterOptionChip",
  components: {},
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
    close: Boolean,
  },
  data() {
    return {
      foo: 42,
      displayValue: "",
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    isEntity() {
      return isOpenAlexId(this.filterValue)
    }
  },
  asyncComputed: {
    filterDisplayValue: async function () {
      // if (!this.isEntity) return this.filterValue

      this.isLoading = true
      const resp = await api.makeAutocompleteResponseFromId(this.filterValue)
      console.log("filterdisplayvalue response", resp)
      this.isLoading = false
      return resp.display_name
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
  async mounted() {


  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>