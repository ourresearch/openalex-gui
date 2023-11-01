<template>
    <!--          <v-subheader>Selected</v-subheader>-->
    <v-list-item
        :key="actionKey"
        :value="config.key"
        :disabled="isDisabled"
        @click="click"
    >
      <v-list-item-icon>
        <v-icon>{{ config.icon }}</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          {{ config.displayName }}
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-icon>
        <v-icon v-if="isSelected">mdi-checkbox-marked</v-icon>
        <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
      </v-list-item-icon>
    </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {
    action: String,
    actionKey: String,
    isSelected: Boolean,
    isDisabled: Boolean,
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
    config(){
      return getFacetConfig(this.entityType, this.actionKey)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    click(){
      console.log("click")
      if (this.action === "filter") {
        console.log("click filter")
      }
      else {
        (this.isSelected) ?
            url.deleteActionKey(this.action, this.actionKey) :
            url.addActionKey(this.action, this.actionKey)

      }
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