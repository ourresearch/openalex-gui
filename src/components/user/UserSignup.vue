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
        <v-text-field
            flat
            hide-details
            solo
            type="email"
            class="mt-3"
            v-model="name"
            prepend-icon="mdi-account-outline"
            placeholder="Your name"
            outlined
        >
        </v-text-field>
        <v-btn
          dark
          color="primary"
          class="ml-8 mt-4"
          @click="submit"
        >
          Create account
        </v-btn>
      </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "UserSignup",
  components: {},
  props: {},
  data() {
    return {
      email: "",
      name: "",
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
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
        "requestSignupEmail",
    ]),
    async submit(){
      this.isLoading = true
      await this.requestSignupEmail({
        email: this.email,
        displayName: this.name
      })
      this.isLoading = false
    }

  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>