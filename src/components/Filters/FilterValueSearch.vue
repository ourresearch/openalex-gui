<template>
  <div class="d-flex align-center" >
    <v-text-field
        dense
        autofocus
        outlined
        prepend-inner-icon="mdi-magnify"
        v-model="myFilterValue"
        :label="myFilterConfig.displayName"
        @keypress.enter="$emit('update', myFilterValue)"
        class="ml-3"
        :disabled="disabled"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";

export default {
  name: "FilterValueSearch",
  components: {},
  props: {
    filterKey: String,
    filterValue: String,
    disabled: Boolean,
  },
  data() {
    return {
      foo: 42,
      myFilterValue: this.filterValue,
      myFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.myFilterKey)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setIsNegated(val){
      this.myIsNegated = !!val
      this.submit()
    },
    submit(){
      this.$emit("submit", this.myFilterValue, this.myIsNegated)
    }

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

<style scoped lang="scss">

</style>