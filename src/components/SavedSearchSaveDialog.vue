<template>
  <v-dialog v-model="myIsOpen" max-width="600">
      <v-card :loading="isLoading" v-if="userId" flat rounded>
        <v-card-title>{{ myHasAlert ? "Save search and set alert" : "Save search" }}</v-card-title>
        <div class="pa-4">
          <v-text-field
              autofocus
              rounded
              filled
              clearable
              placeholder="Search name (required)"
              v-model="nameString"
              @keydown.enter="save"
              counter="25"
          />
        </div>
        <v-list nav >
          <v-list-item @click="myHasAlert = !myHasAlert">
            <v-list-item-action>
              <v-switch readonly v-model="myHasAlert" />
            </v-list-item-action>
            <v-list-item-content>
            <v-list-item-title>
              Receive alerts
            </v-list-item-title>
            <v-list-item-subtitle>
              Get an email when new results appear in this search
            </v-list-item-subtitle>

            </v-list-item-content>
          </v-list-item>

        </v-list>
        <v-card-actions>
          <v-spacer />
          <v-btn text rounded @click="myIsOpen = false">Cancel</v-btn>
          <v-btn text rounded color="primary" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        You have to login to save searches or set alerts.
      </v-card-text>
      <v-card-actions>
          <v-spacer />
          <v-btn text rounded to="/login">Log in</v-btn>
          <v-btn text rounded color="primary" to="signup">Register</v-btn>
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
      isLoading: false,
      myHasAlert: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
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
    ...mapActions([]),
    ...mapActions("user", [
        "updateSearchDescription",
    ]),
    async save(){
      console.log("save search", this.nameString, this.myHasAlert)
      this.isLoading = true
      await this.$store.dispatch("user/createSearch", {
        search_url: this.currentUrl,
        description: this.nameString,
        has_alert: this.myHasAlert
      })
      this.myIsOpen = false
      this.isLoading = false
      this.snackbar("New search saved.")
    }


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
      this.myHasAlert = this.hasAlert
    }
  }
}
</script>

<style scoped lang="scss">

</style>