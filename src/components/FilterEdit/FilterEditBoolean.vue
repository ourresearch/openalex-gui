<template>
  <v-card flat>
    <v-toolbar flat dense>
      <v-icon left>{{ myConfig.icon }}</v-icon>
      <v-toolbar-title>
        {{ myConfig.displayName }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="pt-0">
      <div>
          <v-switch
              v-model="myValue"
              :label="myConfig.displayName"
          />
      </div>
      <div>
        Show only {{ entityType | pluralize(1) }} that
        <span>
          <span v-if="myValue">are</span>
          <span v-else class="font-weight-bold">are NOT</span>
        </span>
        {{ myConfig.displayName }}
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn text rounded @click="update">Cancel</v-btn>
      <v-btn  rounded  color="primary" @click="update">
        {{ createMode ? "Add filter" : "Update filter"}}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "../../facetConfigs";

export default {
  name: "FilterEditBoolean",
  components: {},
  props: {
    filterKey: String,
    filterValue: [Boolean, String],
    createMode: Boolean,
  },
  data() {
    return {
      foo: 42,
      myValue: (this.createMode) ? true : this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType"
    ]),
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    update() {
      this.$emit("update", this.myValue)
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