<template>
  <v-container class="d-flex justify-center fill-height">
    <v-card loading max-width="600" min-width="300" flat rounded class="">
      <v-card-title>
        Logging you in...
      </v-card-title>
      <v-card-text>
        <div>user id: {{ userId }}</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "MagicToken",
  components: {
  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "userId",
      "userName",
      "userEmail",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
        "loginWithMagicToken"
    ]),


  },
  created() {
  },
  async mounted() {
    await this.loginWithMagicToken(this.$route.params.token)
    this.$router.push("/me")
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>