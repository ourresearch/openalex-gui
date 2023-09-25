<template>
  <span
      @click:close="$emit('remove')"
  >
    <span v-if="isFirst">
      <span v-if="hasSiblings">are</span>
      <span v-else>is</span>
    </span>
    <v-menu :close-on-content-click="false" max-width="350" rounded v-model="isOpen">
      <template v-slot:activator="{on}">
        <a v-on="on" class="font-weight-bold">
          <template v-if="filterDisplayValue" class="font-weight-bold">
            {{ filterDisplayValue | truncate(80) }}
          </template>
          <template v-else>
            Loading...
          </template>
        </a>
      </template>
      <v-card>
        <v-card-title class="capitalize-first-letter">{{ filterDisplayValue }}</v-card-title>
        <v-card-subtitle>{{ filterValue }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer/>
          <v-btn text rounded color="error" @click="$emit('delete')">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
    <!--<a  @click="addAnother">(+)</a>-->{{ appendSeparator ? "; " : "" }}


    <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->




  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {isOpenAlexId} from "@/util";

export default {
  name: "FilterValueChip",
  components: {},
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
    close: Boolean,
    isFirst: Boolean,
    hasSiblings: Boolean,
    appendSeparator: Boolean,
    appendPeriod: Boolean,
  },
  data() {
    return {
      foo: 42,
      displayValue: "",
      isLoading: false,
      isOpen: false,
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
      if (!this.isEntity) return this.filterValue

      this.isLoading = true
      const resp = await api.makeAutocompleteResponseFromId(this.filterValue)
      this.isLoading = false
      return resp.display_name
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    addAnother(){
      this.$emit('add-another')
      this.isOpen = false

    }


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