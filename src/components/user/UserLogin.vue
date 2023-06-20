<template>
      <div class="">
        <v-text-field
            flat
            hide-details
            solo
            type="email"
            class="mt-0"
            prepend-icon="mdi-email-outline"
            v-model="email"
            placeholder="Your email"
            outlined
        >
        </v-text-field>
        <v-btn
          dark
          color="primary"
          class="ml-8 mt-4"
          @click="submit"
        >
          Get signin link
        </v-btn>
      </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "UserLogin",
  components: {},
  props: {},
  data() {
    return {
      email: "",
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
        "requestLoginEmail",
    ]),
    async submit(){
      this.isLoading = true
      await this.requestLoginEmail(this.email)
      this.isLoading = false
    }

  },
  created() {
  },
  mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>