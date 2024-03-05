<template>
  <v-menu>
    <template v-slot:activator="{on}">
      <v-chip
          v-on="on"
          :disabled="isDisabled"
          outlined
          label
          style="width: 100%;"
          class="font-weight-regular py-4 justify-center"
      >
        {{ selectedOption }}
        <v-icon right>mdi-menu-down</v-icon>
      </v-chip>
    </template>
    <v-list>
      <v-list-item
        v-for="(str, i) in options"
        :key="i"
        @click="setIsNegated(i)"
      >
        <v-list-item-icon>
          <v-icon v-if="indexIsSelected(i)">mdi-check</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          {{ str }}
        </v-list-item-content>
      </v-list-item>
    </v-list>


  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";


export default {
  name: "Template",
  components: {},
  props: {
    isNegated: Boolean,
    value: [String, Boolean],
    type: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
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
        return ["includes"]
      } else if (this.type === "select") {
        return this.value.includes("|") ?
            ["is any of", "is none of"] :
            ["is", "is not"]
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    setIsNegated(i){
      this.$emit("set", i !== 0)
    },
    indexIsSelected(i){
      return this.isNegated ?
          i === 1 :
          i === 0
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