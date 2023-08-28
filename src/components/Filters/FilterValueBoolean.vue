<template>
  <div>
    <v-select
      dense
      :items="options"
      item-text="displayValue"
      item-value="value"
      v-model="selectedValue"

      @input="onInput"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";

export default {
  name: "FilterValueBoolean",
  components: {
  },
  props: {
    readonly: Boolean,
    filterKey: String,
    filterValue: String,
    displayValue: String,
  },
  data() {
    return {
      foo: 42,
      options: [],
      selectedValue: this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    onInput(){
      this.$emit("input", this.selectedValue)
      this.$emit("submit")
    }


  },
  created() {
  },
  async mounted() {
    const resp = await axios.get(
            url.makeGroupByUrl(this.filterKey)
        )

    this.options = resp
    console.log("FilterValueBoolean resp", this.entityType, this.filterKey, resp.data)

    this.options = resp.data.group_by.map(group => {
      return createDisplayFilter(
              this.entityType,
              this.filterKey,
              group.key,
              false,
              group.key_display_name,
              group.count,
          )
    })
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>