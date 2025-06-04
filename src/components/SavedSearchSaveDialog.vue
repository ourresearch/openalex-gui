<template>
  <v-dialog v-model="myIsOpen" max-width="500">
      <v-card :loading="isLoading" :disabled="isLoading" v-if="userId" flat rounded>
        <v-card-title>{{ myHasAlert ? "Create alert" : "Save search" }}</v-card-title>
        <v-card-subtitle v-if="myHasAlert">
          Save this search and subscribe to alerts
        </v-card-subtitle>
        <div class="pa-4 pb-0">
          <v-text-field
              autofocus
              rounded
              variant="filled"
              clearable
              placeholder="Name (required)"
              v-model="nameString"
              @keydown.enter="save"
              counter="25"
          />
          <v-textarea
              rounded
              variant="filled"
              placeholder="Description (optional)"
              v-model="descriptionString"
              @keydown.meta.enter="save"
              counter="200"
          />
        </div>
        <v-list nav class="pt-0 pb-6 px-6">
          <v-list-item @click="myHasAlert = !myHasAlert" class="">
            <v-list-item-action>
              <v-switch readonly v-model="myHasAlert" />
            </v-list-item-action>
            
            <v-list-item-title>
              Receive alerts
            </v-list-item-title>
            <v-list-item-subtitle style="white-space: normal;">
              Get an email when new results appear in this search

            </v-list-item-subtitle>

            
          </v-list-item>

        </v-list>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="myIsOpen = false">Cancel</v-btn>
          <v-btn rounded color="primary" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        To {{ myHasAlert ? "set alerts" : "save searches" }}, you must be signed up and logged in.
      </v-card-text>
      <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    isOpen: Boolean,
    hasAlert: Boolean,
  },
  data() {
    return {
      foo: 42,
      nameString: "",
      descriptionString: "",
      isLoading: false,
      myHasAlert: false,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    currentUrl(){
      return "https://openalex.org" + this.$route.fullPath
    },
    myIsOpen: {
      get(){return this.isOpen},
      set(to){
        this.$emit("close")
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
        "setIsLoginDialogOpen",
        "setIsSignupDialogOpen",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
        "updateSearchDescription",
    ]),
    async save(){
      console.log("save search", this.nameString, this.myHasAlert)
      this.isLoading = true
      await this.$store.dispatch("user/createSearch", {
        search_url: this.currentUrl,
        name: this.nameString,
        description: this.descriptionString,
        has_alert: this.myHasAlert
      })
      this.myIsOpen = false
      this.isLoading = false
      this.snackbar("Search saved.")
    },
    clickSignup(){
      this.myIsOpen = false
      this.setIsSignupDialogOpen(true)
    },
    clickLogin(){
      this.myIsOpen = false
      this.setIsLoginDialogOpen(true)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route"(){
    },
    isOpen(){
      this.nameString = ""
      this.descriptionString = ""
      this.myHasAlert = this.hasAlert
    }
  }
}
</script>

<style scoped lang="scss">

</style>