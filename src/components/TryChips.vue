<template>
  <div class="mt-2">
    <span class="caption mr-2">Try:</span>
    <v-chip
        v-for="(idea, i) in ideas"
        :key="idea"
        class="mr-2 mb-2"
        small
        label
        outlined
        @click="$emit('select', idea)"
    >
      {{ idea }}
    </v-chip>
  </div>
</template>



<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    ideas: Array,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
    console.log("Chips")
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>