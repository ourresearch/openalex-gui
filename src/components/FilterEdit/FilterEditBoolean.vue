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

    <v-card-text class="pt-0">
      <div class="pb-4">
        <v-list-item-group mandatory v-model="myValue" active-class="primary--text">
          <v-list-item
              v-for="val in [true, false]"

            :key="`list-item-${val}`"
            :value="val"
            filter
            large

          >
            is {{ val }}
          </v-list-item>

        </v-list-item-group>

      </div>
      <div>
        Show only {{ entityType | pluralize(2) }} that
        <span>
          <span v-if="myValue">are</span>
          <span v-else class="font-weight-bold">are NOT</span>
        </span>
        {{ myConfig.displayName }}
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
        <v-btn
            text
            rounded
            color="primary"
            @click="$emit( 'upsert', myValue)"
        >
          Ok
        </v-btn>

    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "../../facetConfigs";
import Template from "@/SerpTabs.vue";
import {url} from "../../url";

export default {
  name: "FilterEditBoolean",
  components: {Template},
  props: {
    filterKey: String,
    filterValue: [Boolean, String],
    createMode: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType"
    ]),
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    myValue: {
      get(){
        return url.readFilterValue(this.entityType, this.filterKey)
      },
      set(to){
        return url.upsertFilter(this.entityType, this.filterKey, to)
      }
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
  watch: {
    // myValue(to, from){
    //   this.$emit("upsert", this.myValue)
    // }
  }
}
</script>

<style scoped lang="scss">

</style>