<template>
    <v-card flat rounded :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title>
      <div v-if="!isSubmitted">
        <v-icon left>mdi-account</v-icon>
        Log in
      </div>
        <div v-else>
          <v-icon left>mdi-email-outline</v-icon>
        Check your email
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
            OpenAlex uses passwordless login: submit your email and we'll send you a magic login link.
          </p>

            <v-text-field
                filled
                rounded
                hide-details
                type="email"
                class="mt-0"
                prepend-icon="mdi-email-outline"
                v-model="email"
                autofocus
                placeholder="Your email"
                @keyup.enter="submit"
            >
            </v-text-field>


        </v-card-text>

      </v-slide-x-transition>
      <v-card-actions>
        <v-spacer/>
        <v-btn
            :disabled="isFormDisabled"
            rounded
            color="primary"
            @click="submit"
            v-if="!isSubmitted"
        >
          Send login link
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
    isFormDisabled() {
      const isDirty = !!this.email
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isValid = emailRegex.test(this.email)
      return this.isLoading || (isDirty && !isValid)
    }
  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "userId",
      "requestLoginEmail",
    ]),
    async submit() {
      if (this.isFormDisabled) return false
      this.isLoading = true
      await this.requestLoginEmail(this.email)
      this.isLoading = false
      this.isSubmitted = true
    },

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