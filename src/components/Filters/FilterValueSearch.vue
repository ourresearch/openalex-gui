<template>
  <v-card  dark flat>
    <v-toolbar  color="transparent" dense flat>
      <v-icon small left>{{ myFilterConfig.icon }}</v-icon>
      {{ myFilterConfig.displayName }}
      <v-spacer></v-spacer>
      <v-btn icon small @click="$emit('delete', filter.key)">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text class="pt-0">
    <v-text-field
        dense
        hide-details
        outlined
        v-model="myFilterValue"
        @keypress.enter="$emit('update', myFilterValue)"
        class="pb-0 mb-0"
        :disabled="disabled"
    />

    </v-card-text>
  </v-card>
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
    setIsNegated(val) {
      this.myIsNegated = !!val
      this.submit()
    },
    submit() {
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