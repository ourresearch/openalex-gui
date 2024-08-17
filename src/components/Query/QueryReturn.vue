<template>
  <span>

    <v-autocomplete
        class="ml-2"
        v-model="selected"
        :items="options"
        item-text="displayName"
        item-value="id"
        placeholder="Add column"
        label="Add column"
        hide-details
        clearable
        rounded
        filled
        dense
        @input="handleInput"
        ref="QueryReturnAutocomplete"
    />
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      selected: null,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "returnedEntityType"
    ]),
    options() {
      if (!this.returnedEntityType) {
        return []
      }
      return Object.values(getConfigs()[this.returnedEntityType].columns)
          .filter(col => {
            return col.actions?.includes("column")
          })
          .filter(col => {
            return !this.query.return.includes(col.id)
          })
    },
    iconName() {
      return this.query.sort_by.direction === "asc" ? "mdi-sort-ascending" : "mdi-sort-descending"
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
      "toggleSummarize",
      "toggleSortByDirection",
    ]),
    ...mapActions("search", [
      "addReturnColumn",
    ]),
    ...mapActions("user", []),
    handleInput(value) {

      console.log("handleInput", value)
      this.addReturnColumn(value)
      this.$nextTick(() => {
        this.selected = null
        // Remove focus from the autocomplete
        if (this.$refs.QueryReturnAutocomplete) {
          this.$refs.QueryReturnAutocomplete.blur()
        }
      })

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>