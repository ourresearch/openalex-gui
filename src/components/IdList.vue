<template>
  <ul>
    <li v-for="idPair in liveIds" :key="idPair.ns">
      <strong>{{idPair.ns}}: </strong>
      <a v-if="idPair.isLink" :href="idPair.id" target="_blank">{{idPair.id}}</a>
      <span v-if="!idPair.isLink">{{idPair.id}}</span>
    </li>
  </ul>
</template>


<script>

export default {
  components: {
  },
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
    liveIds(){
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
        return true
      })

    }
  },
  created() {},
  mounted() {},
  watch: {}
}
</script>

<style lang="scss">


</style>