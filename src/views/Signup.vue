<template>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Signup",
    metaInfo() {
        return {title: "Sign up" }
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
      "isSignupDialogOpen",
    ])
  },
  methods: {
    ...mapMutations("user", [
      "setIsSignupDialogOpen"
    ]),
  },
  created() {
  },
  mounted() {
    if (this.userId) {
      this.$router.push("/")
    }
    this.setIsSignupDialogOpen(true)
  },
  watch: {
    isSignupDialogOpen() {
      this.setIsSignupDialogOpen(true)
    }
  }
}
</script>


<style scoped lang="scss">

</style>