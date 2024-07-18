<template>
  <v-container fluid class="pt-0">
    <v-row>
      <v-col>
        <OqlBox/>
      </v-col>
    </v-row>
    <v-row>
      {{ results }}
    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import OqlBox from "@/components/OqlBox.vue";
import {ret1} from "@/data/mockResults1";

export default {
  name: "Template",
  components: {
    OqlBox,
  },
  props: {},
  data() {
    return {
      foo: 42,
      results: null,
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
    getResults(){
      console.log("getResults", this.$route.query.q)
      this.$store.state.isLoading = true
      setTimeout(() => {
        this.results = _.cloneDeep(ret1)
        this.$store.state.isLoading = false
      }, 500)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.q": {
      handler: function (value) {
        this.getResults()
      },
      immediate: true
    }


  }
}
</script>

<style scoped lang="scss">

</style>