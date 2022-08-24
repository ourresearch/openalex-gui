<template>
  <!--  <v-chip-->
  <!--      outlined-->
  <!--      :to="data.id | idLink"-->
  <!--      class="mr-1 mb-1"-->
  <!--  >-->
  <!--    <div>-->
  <!--      <span :class="`concept-level level-${data.level}`">{{ levelChar }}</span>-->
  <!--      {{ data.display_name }}-->

  <!--    </div>-->

  <!--  </v-chip>-->
  <router-link
      :to="data.id | idLink"
      style="white-space: nowrap; display: inline-block;"
      class="text-decoration-none"
  >{{ data.display_name }}{{ (appendComma) ? ',' : '' }}</router-link>


</template>


<script>

export default {
  components: {},
  props: {
    data: Object,
    appendComma: Boolean,
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