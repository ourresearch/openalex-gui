<template>
  <v-card flat>
    <v-toolbar flat dense>
      <v-icon left>{{ myConfig.icon }}</v-icon>
      <v-toolbar-title>
        {{ myConfig.displayName }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-text-field
          autofocus
          v-model="myValue"
          placeholder="Enter filter value"
          outlined
          hide-details
          @keydown.enter="update"
      />
    </v-card-text>
    <v-card-actions>

      <v-spacer />
      <v-btn text color="primary" @click="update">Update</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "../../facetConfigs";

export default {
  name: "FilterEditRange",
  components: {},
  props: {
    filterKey: String,
    filterValue: String,
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
    update(){
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