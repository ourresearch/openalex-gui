<template>
  <v-card rounded flat>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon left>mdi-filter-outline</v-icon>
        {{ myConfig.displayName }}
      </v-toolbar-title>
      <v-spacer/>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>
    <v-card-text class="pt-4">
      <v-text-field
            autofocus
            rounded
            clearable
            outlined
            v-model="myValue"
            placeholder="Search"
            hide-details
            prepend-inner-icon="mdi-magnify"
            @keyup.enter="$emit('upsert', myValue)"
        />
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn text rounded @click="$emit('close')">Cancel</v-btn>
      <template v-if="createMode">
        <v-btn
            text
            rounded
            color="primary"
            @click="$emit('upsert', myValue)"
            :disabled="!myValue"
        >
          Create
        </v-btn>
      </template>
      <template v-else>
        <v-btn
            text
            rounded
            :color="myValue ? 'primary' : 'error'"
            @click="$emit((myValue ? 'upsert' : 'delete'), myValue)"
            :disabled="filterValue === myValue"
        >
          {{  myValue ? 'Update' : 'Delete' }}
        </v-btn>
      </template>

    </v-card-actions>



  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "../../facetConfigs";
import Template from "@/SerpTabs.vue";

export default {
  name: "FilterEditRange",
  components: {Template},
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