<template>
      <v-card>
        <v-card-title>
          <v-icon left>mdi-email-plus-outline</v-icon>
          Create alert for search
        </v-card-title>
        <v-card-text>
          <p>
          You'll get an email at <strong>{{ userEmail }}</strong> whenever a new work appears in this search.
          </p>
          <p>
            You can delete the alert in your <router-link to="/me/email-alerts">user settings.</router-link>
          </p>
        </v-card-text>

        <v-card-actions class="py-6">
          <v-spacer></v-spacer>
          <v-btn text @click="$emit('close')">Cancel</v-btn>
          <v-btn color="primary" @click="create">Create alert</v-btn>
        </v-card-actions>
      </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "SerpToolbarEmailAlert",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "inputFiltersAsString",
    ]),
    ...mapGetters("user", [
      "userEmail",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async create(){
      const args = {
        filter: this.inputFiltersAsString
      }
      await this.$store.dispatch("user/createEmailAlert", args)
      this.snackbar("Email alert created")
      this.$emit("close")
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