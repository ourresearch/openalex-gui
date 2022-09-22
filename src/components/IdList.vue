<template>
  <div class="">
    <div
        v-for="idObj in liveIds"
        :key="idObj.namespace + idObj.url"
        style="white-space: nowrap;"
    >

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
              small
              icon
              :href="idObj.url"
              target="_blank"
              v-bind="attrs"
              v-on="on"
          >
            <v-icon
                small
            >
<!--              {{ (idObj.namespace==='openalex') ? 'mdi-link' : 'mdi-open-in-new' }}-->
              mdi-link
            </v-icon>
          </v-btn>
        </template>
        <span>Open on {{ idObj.provider }}</span>
      </v-tooltip>


      <span>{{ idObj.displayNamespace }}: </span>
      <span style="font-family: monospace;">
        {{ idObj.simpleId }}
      </span>

      <v-tooltip v-if="0" bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
              small
              icon
              @click="copyToClipboard(idObj.simpleId)"
              v-bind="attrs"
              v-on="on"
          >
            <v-icon
                small
            >
              mdi-content-copy
            </v-icon>
          </v-btn>
        </template>
        <span>Copy to clipboard</span>
      </v-tooltip>




    </div>
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
        }
        else { // id is a simple string
          ids.push(makeIdObject(idKey, idValue))
        }
      })

      if (issnL){
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