<template>
  <v-dialog v-model="isOpen" max-width="500">


    <v-card outlined rounded :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title>
        <div>
          <v-icon left>mdi-account</v-icon>
          Log in
        </div>
        <v-spacer/>
        <v-btn icon  @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <!--      <v-divider></v-divider>-->
      <v-card-text>

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
        >
        </v-text-field>
        <v-text-field
            filled
            rounded
            hide-details
            class="mt-3"
            prepend-icon="mdi-lock-outline"
            v-model="password"
            placeholder="Password"
            :type="isPasswordVisible ? 'text' : 'password'"
            :append-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="isPasswordVisible = !isPasswordVisible"
            @keyup.enter="submit"
        >
        </v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
            :disabled="isFormDisabled"
            rounded
            color="primary"
            @click="submit"
        >
          Log in
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "UserLogin",
  components: {},
  props: {
  },
  data() {
    return {
      email: "",
      password: "",
      isPasswordVisible: false,
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    ...mapGetters("user", [
      "userId",
      "userName",
      "isLoginDialogOpen"
    ]),
    isFormDisabled() {
      const isDirty = !!this.email || !!this.password
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isValid = emailRegex.test(this.email) && this.password?.length >= 5
      return this.isLoading || (isDirty && !isValid)
    },
    isOpen: {
      get() {
        return this.isLoginDialogOpen
      },
      set(val) {
        this.setIsLoginDialogOpen(val)
      },
    },
  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setIsLoginDialogOpen",
    ]),
    ...mapActions("user", [
      "loginUser",
    ]),
    async submit() {
      if (this.isFormDisabled) return false
      this.isLoading = true
      await this.loginUser({
        email: this.email,
        password: this.password,
      })
      this.isLoading = false
      this.isOpen = false
      this.snackbar(`You're logged in. Welcome back, ${this.userName}!`)
    },

  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from){
      this.email = ""
      this.password = ""
      this.isLoading = false
      this.isPasswordVisible = false
    },
  }
}
</script>

<style scoped lang="scss">

</style>