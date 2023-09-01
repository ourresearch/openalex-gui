<template>
  <div class="d-flex">
    <v-text-field
            dense
            hide-details
            v-model="start"
            label="Start"
            @keypress.enter="$emit('update', asStr)"
    />
    <span class="mx-3">&mdash;</span>
    <v-text-field
            dense
            hide-details
            v-model="end"
            label="End"
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