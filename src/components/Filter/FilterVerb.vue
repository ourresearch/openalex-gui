<template>
  <v-menu>
    <template v-slot:activator="{props}">
      <v-chip
          v-bind="props"
          :disabled="isDisabled"
          variant="outlined"
          label
          style=""
          class="font-weight-regular py-4 justify-center"
      >
        {{ selectedOption }}
        <v-icon end>mdi-menu-down</v-icon>
      </v-chip>
    </template>
    <v-list>
      <v-list-item
        v-for="(str, i) in options"
        :key="i"
        @click="setIsNegated(i)"
      >
        <v-icon v-if="indexIsSelected(i)">mdi-check</v-icon>
        {{ str }}
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>

import {mapGetters} from "vuex";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterVerb",
  components: {},
  props: {
    isNegated: Boolean,
    value: [String, Boolean],
    type: String,
    filterKey: String,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    myConfig(){
      return getFacetConfig(this.entityType, this.filterKey)
    },
    selectedOption(){
      return this.isNegated ?
          this.options[1] :
          this.options[0]
    },
    isDisabled(){
      return ["range", "search"].includes(this.type)
    },
    options() {
      if (this.type === "boolean") {
        return ["is", "is not"]
      } else if (this.type === "range") {
        if (this.value.includes("-")) {
          return ["is within range"]
        } else {
          return ["is"]
        }
      } else if (this.type === "search") {
        return [this.myConfig.verb ?? "includes"]
      } else if (this.type === "select") {
        return this.value.includes("|") ?
            ["is any of", "is none of"] :
            ["is", "is not"]
      }
      return null;
    }
  },
  methods: {
    setIsNegated(i){
      this.$emit("set", i !== 0)
    },
    indexIsSelected(i){
      return this.isNegated ?
          i === 1 :
          i === 0
    }
  },
}
</script>


<style scoped lang="scss">

</style>