<template>
  <div>
    <div class="text-h4 ml-1">My Corrections</div>

    <v-card rounded border class="my-4">

      <v-alert type="warning" icon="mdi-progress-wrench">
        Support for submitting data correction will be coming soon.
      </v-alert>    

      <v-card-text v-if="!userCorrections.length">You haven't submitted any corrections yet.</v-card-text>
      <v-list v-else color="transparent">
        <v-list-item
            v-for="cor in userCorrections"
            :key="cor.id"
        >
          <v-icon>mdi-tag-outline</v-icon>
          
            <v-list-item-title>{{ cor.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ cor.comments }}</v-list-item-subtitle>
          
          <v-list-item-action>
            <v-btn icon @click="deleteCorrection(cor.id)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>

  </div>
</template>


<script>

import {mapActions, mapGetters} from "vuex";

export default {
  name: "MeCorrections",
  components: {
  },
  props: {},
  data() {
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userCorrections",
    ]),
  },
  methods: {
    ...mapActions("user", [
      "deleteCorrection",
    ]),
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