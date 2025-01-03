<template>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Login",
    metaInfo() {
        return {title: "Log in" }
    },
  components: {},
  props: {},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "isLoginDialogOpen",
    ])
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapMutations("user", [
      "setIsLoginDialogOpen",
    ]),
  },
  created() {
  },
  mounted() {
    if (this.userId) {
      this.$router.push("/")
    }
    this.setIsLoginDialogOpen(true)
  },
  watch: {
    isLoginDialogOpen() {
      this.setIsLoginDialogOpen(true)
    }
  }
}
</script>

<style scoped lang="scss">

</style>