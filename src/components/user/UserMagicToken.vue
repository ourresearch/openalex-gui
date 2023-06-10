<template>
  <v-container>
    <v-card>
      <v-card-title>
        Logging you in with magic token in the URL...
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
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
        "loginWithMagicToken"
    ]),


  },
  created() {
  },
  async mounted() {
    await this.loginWithMagicToken(this.$route.params.token)
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>