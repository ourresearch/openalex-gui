<template>
  <v-menu>
    <template v-slot:activator="{on}">
      <v-btn icon v-on="on">
        <v-icon>mdi-dots-horizontal</v-icon>
        <!--        <v-icon>mdi-barcode</v-icon>-->
        <!--        <v-icon small>mdi-menu-down</v-icon>-->
      </v-btn>
    </template>
    <v-list>
      <v-list-item
          v-for="id in liveIds"
          :key="id.namespace"
          :href="id.url"
          target="_blank"
      >
        <v-list-item-content>
          <v-list-item-title>
            <span>{{ id.displayNamespace }}</span>
              <!--              {{ id.shortValue | truncate(50) }}-->
          </v-list-item-title>
          <!--          <v-list-item-subtitle>-->
          <!--            {{ id.displayNamespace }}-->
          <!--          </v-list-item-subtitle>-->
        </v-list-item-content>
        <v-list-item-icon>
          <v-icon>mdi-open-in-new</v-icon>
        </v-list-item-icon>
        <!--        <v-list-item-action>-->
        <!--          <v-btn icon small>-->
        <!--            <v-icon small>mdi-content-copy</v-icon>-->
        <!--          </v-btn>-->
        <!--        </v-list-item-action>-->

      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {idConfigs} from "@/idConfigs";

const makeIdObject = function (k, v) {
  const ret = {...idConfigs[k]}
  ret.id = v
  ret.simpleId = v.replace(ret.prefix, "")
  ret.url = ret.urlPattern + ret.simpleId
  return ret
}
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
    // myIds() {
    //   return Object.keys(this.ids)
    //       .filter(k => {
    //         return !!idConfigs[k]
    //       })
    //       .map(k => {
    //         const config = idConfigs[k]
    //         return {
    //           ...config,
    //           value: this.ids[k],
    //           shortValue: this.ids[k].replace(config.prefix, "")
    //         }
    //       })
    // },
    liveIds() {
      const ids = []
      let issnL
      Object.entries(this.ids).forEach(([idKey, idValue]) => {
        if (idKey === "issn_l") issnL = idValue

        if (!idValue) return false
        if (!idConfigs[idKey]) return false

        if (Array.isArray(idValue)) { // "id" is actually an array of ids
          idValue.forEach(idString => {
            ids.push(makeIdObject(idKey, idString))
          })
        } else { // id is a simple string
          ids.push(makeIdObject(idKey, idValue))
        }
      })

      if (issnL) {
        return ids
            .filter(i => {
              return !(i.namespace === "issn" && i.id === issnL)
            })
            .filter(id => id.namespace !== 'openalex')
            .filter(id => id.namespace !== 'wikipedia')
      } else {
        return ids
            .filter(id => id.namespace !== 'openalex')
            .filter(id => id.namespace !== 'wikipedia')

      }
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