<template>
  <div>
    <template v-if="!labelId">
      <span class="text-h4 ml-1 mr-4">My Labels</span>
      <v-btn 
        v-if="!labelId" 
        @click="isLabelCreateDialogOpen = true"
        rounded 
        color="primary"
        class="new-label-button">
        <v-icon left>mdi-plus</v-icon>
        New Label
      </v-btn>
    </template>
    
    <v-card v-if="labelId" rounded outlined class="my-0">
      <router-view />
    </v-card>
    
    <v-card v-else rounded outlined class="my-4">
      
      <v-card-text v-if="!userCollections.length">You haven't created any labels yet.</v-card-text>
      
      <v-list v-else>
        <v-list-item
            v-for="label in userCollections"
            :key="label.id"
            :to="'/me/labels/' + label.id"
        >
          <v-list-item-icon>
            <v-icon>mdi-tag-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ label.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ label.description }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="deleteCollection(label.id)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>

    <v-dialog v-model="isLabelCreateDialogOpen" width="400">
      <label-create @close="isLabelCreateDialogOpen = false" />
    </v-dialog>

  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import LabelCreate from "@/components/Label/LabelCreate.vue";

export default {
  name: "MeLabels",
  components: {
    LabelCreate,
  },
  props: {},
  data() {
    return {
      isLabelCreateDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userCollections",
    ]),
    labelId() {
      return this.$route.params.labelId || null;
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "deleteCollection",
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
.new-label-button {
  margin-top: -13px;
}
</style>