<template>
  <v-card>
    <v-toolbar flat dense>
      <v-icon left>{{ myConfig.icon }}</v-icon>
      <v-toolbar-title>
        {{ myConfig.displayName }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-list-item>
        <v-list-item-title>
          <span class="text-capitalize">
        {{ entityType | pluralize(1) }}
        </span> is
          {{ myConfig.displayName }}
        </v-list-item-title>
        <v-list-item-action>
          <v-switch
              v-model="myValue"
          />

        </v-list-item-action>
      </v-list-item>
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn text primary @click="update">Update</v-btn>
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
  },
  data() {
    return {
      foo: 42,
      myValue: this.filterValue,
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