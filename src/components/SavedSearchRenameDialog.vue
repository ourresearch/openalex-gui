<template>
  <v-dialog v-model="isOpen" max-width="600">
      <v-card :loading="isLoading" flat rounded>
        <v-card-title>Rename saved search</v-card-title>
        <div class="pa-4">
          <v-text-field
              autofocus
              rounded
              filled
              clearable
              prepend-inner-icon="mdi-magnify"
              placeholder="New name"
              v-model="renameString"
              @keydown.enter="rename"
              counter="25"
          />
<!--          <v-textarea-->
<!--              rounded-->
<!--              filled-->
<!--              placeholder="Description (optional)"-->
<!--              v-model="descriptionString"-->
<!--              @keydown.enter="save"-->
<!--              counter="200"-->
<!--          />-->
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn text rounded @click="isOpen = false">Cancel</v-btn>
          <v-btn text rounded color="primary" @click="rename">Rename</v-btn>
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
    id: String,
  },
  data() {
    return {
      foo: 42,
      renameString: "",
      descriptionString: "",
      isLoading: false
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "renameId",
    ]),
    isOpen: {
      get(){return !!this.renameId},
      set(to){
        return this.$store.commit("user/setRenameId", to)
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
        "updateSearchName",
    ]),
    async rename(){
      console.log("rename search", this.renameId, this.renameString)
      this.isLoading = true
      await this.updateSearchName({id: this.renameId, name: this.renameString})
      this.renameString = ""
      this.isLoading = false
      this.isOpen = false
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