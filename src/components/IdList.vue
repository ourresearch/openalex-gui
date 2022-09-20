<template>
  <div class="body-1">
    <div v-for="idPair in liveIds" :key="idPair.ns">
      <!--      <span>{{idPair.ns}}: </span>-->
      <span>
        {{ idPair.id }}
      </span>

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
              small
              icon
              v-if="idPair.ns !== 'openalex' && idPair.isLink"
              :href="idPair.id"
              v-bind="attrs"
              v-on="on"
          >
            <v-icon
                small
            >
              mdi-open-in-new
            </v-icon>
          </v-btn>
        </template>
        <span>Open via</span>
      </v-tooltip>


    </div>
  </div>
</template>


<script>

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
  methods: {},
  computed: {
    liveIds() {
      return Object.entries(this.data).map(([k, v]) => {
        return {
          ns: k,
          id: v,
          isLink: typeof v === "string" && v.substr(0, 4) === "http"
        }
      })
          .filter(x => {
            if (!x.id) return false
            if (Array.isArray(x.id) && !x.id.length) return false
            if (x.ns === "mag") return false
            return true
          })

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