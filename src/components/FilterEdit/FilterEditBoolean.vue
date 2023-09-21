<template>
  <v-card rounded flat>
    <v-toolbar flat class="d-flex align-center">
      <v-icon left>mdi-filter-outline</v-icon>
      <v-toolbar-items>
      <v-switch
          v-model="myValue"
          :label="myConfig.displayName"
          hide-details
          class="align-self-center"
      />

      </v-toolbar-items>
    </v-toolbar>
    <v-card-text class="pt-0">
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
      <v-btn text rounded @click="$emit('close')">Cancel</v-btn>
      <v-btn rounded color="primary" @click="$emit('upsert', myValue)">
        {{ createMode ? "Add filter" : "Update filter" }}
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