<template>


  <!--  <v-expansion-panel>-->
  <!--    <v-divider/>-->
  <!--    <v-expansion-panel-header>-->
  <!--      Identifiers <span class="caption ml-1">({{ liveIds.length }})</span>-->

  <!--    </v-expansion-panel-header>-->
  <!--    <v-expansion-panel-content class="pa-0">-->
  <v-list class="pa-0">
    <v-list-item
        v-for="(idObj, i) in liveIds"
        :key="idObj.namespace + idObj.url"
        :href="idObj.url" target="_blank"
    >
      <!--            @click="copyToClipboard(idObj.id)"-->
      
        <v-list-item-title>
          {{ idObj.displayNamespace }}
        </v-list-item-title>
        <!--            <v-list-item-subtitle class="grey&#45;&#45;text" style="">-->
        <!--              {{ idObj.simpleId }}-->
        <!--            </v-list-item-subtitle>-->
      
      <span>
        <v-icon small class="mt-1">mdi-open-in-new</v-icon>
      </span>

      <!--          <v-list-item-action>-->
      <!--            <v-btn small icon @click="copyToClipboard(idObj.id)">-->
      <!--              <v-icon small>mdi-content-copy</v-icon>-->
      <!--            </v-btn>-->
      <!--          </v-list-item-action>-->
      <!--          <v-list-item-action>-->
      <!--            <v-menu>-->
      <!--              <template v-slot:activator="{on}">-->
      <!--                <v-btn v-bind="on" small icon >-->
      <!--                  <v-icon small>mdi-dots-horizontal</v-icon>-->
      <!--                </v-btn>-->
      <!--              </template>-->
      <!--                <v-list dense>-->
      <!--                  <v-list-item @click="copyToClipboard(idObj.id)">-->
      <!--                    <v-list-item-title>-->
      <!--                      <v-icon left small>mdi-content-copy</v-icon>-->
      <!--                      Copy to clipboard-->
      <!--                    </v-list-item-title>-->
      <!--                  </v-list-item>-->
      <!--                  <v-list-item :href="idObj.url" target="_blank">-->
      <!--                    <v-list-item-title>-->
      <!--                      <v-icon left small>mdi-open-in-new</v-icon>-->
      <!--                      View on {{ idObj.provider }}-->
      <!--                    </v-list-item-title>-->
      <!--                  </v-list-item>-->
      <!--                </v-list>-->

      <!--            </v-menu>-->

      <!--          </v-list-item-action>-->
    </v-list-item>
  </v-list>


  <!--    </v-expansion-panel-content>-->
  <!--    <v-divider/>-->
  <!--  </v-expansion-panel>-->


</template>


<script>
import {idConfigs} from "../idConfigs";
import {mapActions, mapMutations} from "vuex";

const makeIdObject = function (k, v) {
  const ret = {...idConfigs[k]}
  ret.id = v
  ret.simpleId = v.replace(ret.prefix, "")
  ret.url = ret.urlPattern + ret.simpleId
  return ret
}

export default {
  components: {},
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("Copied to clipboard.")
    },
  },
  computed: {
    liveIds() {
      const ids = []
      let issnL
      Object.entries(this.data).forEach(([idKey, idValue]) => {
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
      }
      else {
        return ids.filter(id => id.namespace !== 'openalex')

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

<style lang="scss">


</style>
