<template>
  <v-container fluid class="pt-0">
    <v-row>
      <v-col>
        <OqlBox/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import OqlBox from "@/components/OqlBox.vue";

export default {
  name: "Template",
  components: {
    OqlBox,
  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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