<template>
    <v-card  v-else :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title>
      <div v-if="!isSubmitted">
        <v-icon left>mdi-login</v-icon>
        Log in
      </div>
        <div v-else>
          <v-icon left>mdi-check</v-icon>
        Link sent!
        </div>
        <v-spacer/>
        <v-btn icon v-if="showCloseButton" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-slide-x-transition group hide-on-leave>
        <v-card-text v-if="isSubmitted" key="submitted">
          We sent your login link to {{ email }}. <strong>Don't forget to check your spam folder.</strong>
        </v-card-text>
        <v-card-text v-else key="ready">
          <p>
            OpenAlex uses passwordless login: just enter your email address below and we'll send you a magic link you can
            use to log in.
          </p>

            <v-text-field
                flat
                hide-details
                solo
                type="email"
                class="mt-0"
                prepend-icon="mdi-email-outline"
                v-model="email"
                autofocus
                placeholder="Your email"
                outlined
                @keyup.enter="submit"
            >
            </v-text-field>


        </v-card-text>

      </v-slide-x-transition>
      <v-card-actions>
        <v-spacer/>
        <v-btn
            :dark="!isSubmitted"
            color="primary"
            @click="submit"
            v-if="!isSubmitted"
        >
          Get login link
        </v-btn>

      </v-card-actions>
    </v-card>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "UserLogin",
  components: {},
  props: {
    showCloseButton: Boolean,
  },
  data() {
    return {
      email: "",
      isLoading: false,
      isSubmitted: false,
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
    async submit() {
      this.isLoading = true
      await this.requestLoginEmail(this.email)
      this.isLoading = false
      this.isSubmitted = true
    }

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