<template>
  <v-card flat rounded :loading="isLoading" :disabled="isLoading" class="">
    <v-card-title>

      <div v-if="!isSubmitted">
        <v-icon left>mdi-account-plus</v-icon>
        Sign up
      </div>
      <div v-else>
        <v-icon left>mdi-check</v-icon>
        Account created!
      </div>
      <v-spacer/>
      <v-btn icon v-if="showCloseButton" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-slide-x-transition group hide-on-leave>
      <v-card-text v-if="isSubmitted" key="submitted">
        We sent a login link to {{ email }}. <strong>Don't forget to check your spam folder.</strong>
      </v-card-text>
      <v-card-text v-else key="ready">
        <p>
          Signing up for an OpenAlex account lets you create alerts and save searches.
        </p>

        <v-text-field
            autofocus
            hide-details
            filled
            rounded
            type="email"
            class="mt-0"
            prepend-icon="mdi-email-outline"
            v-model="email"
            placeholder="Your email"
        >
        </v-text-field>
        <v-text-field
            filled
            rounded
            hide-details
            type="email"
            class="mt-3"
            v-model="name"
            prepend-icon="mdi-account-outline"
            placeholder="Your name"
            @keyup.enter="submit"
        >
        </v-text-field>


      </v-card-text>

    </v-slide-x-transition>
    <v-card-actions>
      <v-spacer/>
      <v-btn
          :disabled="isFormDisabled"
          color="primary"
          @click="submit"
          v-if="!isSubmitted"
          rounded
      >
        Sign up
      </v-btn>
        <v-btn v-else rounded color="primary" @click="$emit('close')">
          OK
        </v-btn>

    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "UserSignup",
  components: {},
  props: {
    showCloseButton: Boolean,
  },
  data() {
    return {
      email: "",
      name: "",
      isLoading: false,
      isSubmitted: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    isFormDisabled() {
      const isDirty = !!this.email || !!this.name
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isEmailValid = emailRegex.test(this.email)
      const isNameValid = !!this.name
      const isFormValid = isEmailValid && isNameValid

      return this.isLoading || (isDirty && !isFormValid)
    }
  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "requestSignupEmail",
    ]),
    async submit() {
      this.isLoading = true
      await this.requestSignupEmail({
        email: this.email,
        displayName: this.name
      })
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