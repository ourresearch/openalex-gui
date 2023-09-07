<template>
  <div class="ml-3 d-flex align-center" style="max-width: 200px;">
    <v-text-field
            dense
            hide-details
            autofocus
            outlined
            v-model="start"
            placeholder="Min"
            @keypress.enter="$emit('update', asStr)"
    />
    <span class="mx-3">&mdash;</span>
    <v-text-field
            dense
            hide-details
            outlined
            v-model="end"
            placeholder="Max"
            @keypress.enter="$emit('update', asStr)"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "FilterValueRange",
  components: {
  },
  props: {
    filterKey: String,
    filterValue: String,
  },
  data() {
    const splitValue = (this.filterValue) ? this.filterValue.split("-") : ["", ""]
    return {
      foo: 42,
      start: String(splitValue[0]),
      end: String(splitValue[1]),
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    asStr(){
      return this.start + "-" + this.end
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
  mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>