<template>
  <div class="d-flex align-center" >
    <v-menu v-if="0">
      <template v-slot:activator="{on}">
        <v-btn
            text
            rounded
            v-on="on"
        >
          {{ (myIsNegated) ? "Doesn't include" : "Includes" }}
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="setIsNegated(false)">
          <v-list-item-icon>
            <v-icon color="success">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            Includes
          </v-list-item-title>
        </v-list-item>
        <v-list-item @click="setIsNegated(true)">
          <v-list-item-icon>
            <v-icon color="error">mdi-close</v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            Doesn't include
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-text-field
        dense
        hide-details
        outlined
        full-width
        prepend-inner-icon="mdi-magnify"
        v-model="myFilterValue"
        :placeholder="myFilterConfig.displayName"
        :label="myFilterConfig.displayName"
        @keypress.enter="$emit('submit', myFilterValue, myIsNegated)"
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
    readonly: Boolean,
    filterKey: String,
    filterValue: String,
    displayValue: String,
    isNegated: Boolean,
  },
  data() {
    return {
      foo: 42,
      myFilterValue: this.filterValue,
      myFilterKey: this.filterKey,
      myIsNegated: this.isNegated,
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