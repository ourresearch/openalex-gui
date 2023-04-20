<template>


  <v-expansion-panel>
    <v-divider/>
    <v-expansion-panel-header>
      Identifiers <span class="caption ml-1">({{ liveIds.length }})</span>

    </v-expansion-panel-header>
    <v-expansion-panel-content class="pa-0">
      <v-list nav dense  class="pa-0">
        <v-list-item
                two-line
                v-for="(idObj, i) in liveIds"
                :key="idObj.namespace + idObj.url"
                @click="copyToClipboard(idObj.id)"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ idObj.displayNamespace }}
            </v-list-item-title>
            <v-list-item-subtitle class="grey--text" style="">
              {{ idObj.simpleId }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn small icon @click="copyToClipboard(idObj.id)">
              <v-icon small>mdi-content-copy</v-icon>
            </v-btn>
          </v-list-item-action>
          <v-list-item-action>
            <v-btn small icon :href="idObj.url" target="_blank">
              <v-icon small>mdi-open-in-new</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-expansion-panel-content>
    <v-divider/>
  </v-expansion-panel>


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
                return ids.filter(i => {
                    return !(i.namespace === "issn" && i.id === issnL)
                })
            }
            return ids
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