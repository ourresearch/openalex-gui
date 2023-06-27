<template>
  <v-card :loading="isLoading">
    <v-card-title>
      Create alert
    </v-card-title>
    <v-card-text>
      <p>
        Every week, there are about {{ velocity.week | toPrecision }} new works published that would meet your current search filters.
      </p>
      <p v-if="velocityPermitsAlerts">
        You'll get an email (up to one a day) at <strong>{{ userEmail }}</strong> whenever a we find one of these newly-published works.
      </p>
      <p v-else>
        That's too many for us to create an alert for. Try narrowing your search by adding more filters.
      </p>
      <p>
        You can delete the alert in your
        <router-link to="/me/email-alerts">user settings.</router-link>
      </p>
    </v-card-text>

    <v-card-actions class="py-6">
      <v-spacer></v-spacer>
      <v-btn text @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" @click="create" :disabled="!velocityPermitsAlerts">Create alert</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";

const userApiBaseUrl = "https://user.openalex.org"


export default {
    name: "SerpToolbarEmailAlert",
    components: {},
    props: {},
    data() {
        return {
            foo: 42,
            isLoading: false,
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "inputFiltersAsString",
            "velocity",
            "velocityPermitsAlerts",
        ]),
        ...mapGetters("user", [
            "userEmail",
        ]),
        velocityIsTooHigh(){

        }
    },

    methods: {
        ...mapMutations([
            "snackbar",
        ]),
        ...mapActions([]),
        async create() {
            const args = {
                filter: this.inputFiltersAsString
            }
            await this.$store.dispatch("user/createEmailAlert", args)
            this.snackbar("Email alert created")
            this.$emit("close")
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