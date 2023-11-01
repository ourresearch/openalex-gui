<template>
  <v-menu rounded>
    <template v-slot:activator="{on}">
      <v-btn icon v-on="on">
        <v-icon>mdi-barcode</v-icon>
      </v-btn>
    </template>
    <v-list dense>
      <v-list-item
          v-for="id in myIds"
          :key="id.namespace"
           @click="copyToClipboard(id.value)"
      >
        <v-list-item-content>
          <v-list-item-title>
            <span>{{ id.displayNamespace }}:</span>
            <span>
              {{ id.shortValue | truncate(50) }}
            </span>
          </v-list-item-title>
          <!--          <v-list-item-subtitle>-->
          <!--            {{ id.displayNamespace }}-->
          <!--          </v-list-item-subtitle>-->
        </v-list-item-content>
        <v-list-item-action>
          <v-btn icon small>
            <v-icon small>mdi-content-copy</v-icon>
          </v-btn>
        </v-list-item-action>

      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {idConfigs} from "@/idConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    ids: Object,
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
    myIds() {
      return Object.keys(this.ids)
          .filter(k => {
            return !!idConfigs[k]
          })
          .map(k => {
            const config = idConfigs[k]
            return {
              ...config,
              value: this.ids[k],
              shortValue: this.ids[k].replace(config.prefix, "")
            }
          })
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("Copied to clipboard.")
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