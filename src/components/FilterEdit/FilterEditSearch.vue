<template>
  <v-card rounded flat>
    <v-toolbar flat >
<!--      <v-icon left>{{ myConfig.icon }}</v-icon>-->
      <v-text-field
          autofocus
          rounded
          clearable
          v-model="myValue"
          :placeholder="myConfig.displayName"
          hide-details
          prepend-icon="mdi-magnify"
          @keyup.enter="$emit('upsert', myValue)"
      />
    </v-toolbar>
    <v-divider></v-divider>
    <v-card-text class="pt-4">
      Here are a few words about this filter.
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn text rounded @click="$emit('close')">Cancel</v-btn>
      <v-btn  rounded  color="primary" @click="$emit('upsert', myValue)">
        {{ createMode ? "Add search" : "Update search"}}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "../../facetConfigs";

export default {
  name: "FilterEditSearch",
  components: {},
  props: {
    filterKey: String,
    filterValue: String,
    createMode: Boolean,
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