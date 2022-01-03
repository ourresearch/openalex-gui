<template>
  <v-chip
      :to="data.id | idLink"
      class="mr-2"
      small
  >
    <div>
      <span :class="`concept-level level-${data.level}`">{{ levelChar }}</span>
      {{ data.display_name }}

    </div>

  </v-chip>


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
    levelChar() {
      // const chars = [
      //   "🄌",
      //   "➊",
      //   "➋",
      //   "➍",
      //   "➎",
      //   "➏",
      //
      // ]
      const chars = [
        "⓪",
        "①",
        "②",
        "③",
        "④",
        "⑤",

      ]
      return chars[this.data.level]
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">
span.concept-level {
  //font-size: 130%;
  vertical-align: bottom;

  &.level-0 {
    //font-size: 100%;
  }
}


</style>