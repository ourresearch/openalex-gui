<template>
  <!--          <v-list-subheader>Selected</v-list-subheader>-->
  <v-chip
      :key="actionKey"
      :disabled="isDisabled"
      @click="click"
      :outlined="!isSelected"
      :input-value="isSelected"
      filter
      color="primary"
      class="mb-1 mr-1"
  >
    <!--        @click:close="clickClose"-->
    <!--        close-icon="mdi-close"-->
    <!--        <v-icon left>{{ config.icon }}</v-icon>-->
    {{ config.displayName }}
  </v-chip>
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

      "entityType",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.actionKey)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    click() {
      console.log("click");

      (this.isSelected) ?
          url.deleteActionKey(this.action, this.actionKey) :
          url.addActionKey(this.action, this.actionKey)

    },


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
