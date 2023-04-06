<template>
  <div class="">


    <v-menu
        v-for="(idObj, i) in liveIds"
        :key="idObj.namespace + idObj.url"
        dense
    >
      <template v-slot:activator="{on}">
        <a v-on="on" class="caption">
          {{ idObj.displayNamespace }}{{ (i < liveIds.length-1) ? "," : "" }}
        </a>
      </template>
      <v-list dense>
        <div
            class="px-5 py-2"
            style="font-family: monospace; background-color: #333; color: #fff; font-size: 14px;">
          {{idObj.id}}
        </div>
        <v-list-item @click="copyToClipboard(idObj.id)">
          <v-icon left>mdi-content-copy</v-icon>
          Copy to clipboard
        </v-list-item>
        <v-list-item :href="idObj.url" target="_blank">
          <v-icon left>mdi-open-in-new</v-icon>
          View on {{ idObj.provider }}
        </v-list-item>
      </v-list>
    </v-menu>

  </div>
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