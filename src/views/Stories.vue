<template>
  <v-container class="">
    <div class="text-h3 d-flex">
      Stories
      <v-btn
          x-large
          rounded
          color="primary"
          @click="getStories"
          class="ml-4"
          :loading="isLoading"
      >
        Get stories
      </v-btn>
    </div>
    <div v-if="stories.length">
    </div>
    <v-card rounded flat v-else class="pa-10 my-6 d-flex">
      <v-card-text>No stories to show</v-card-text>
    </v-card>
  </v-container>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {
  },
  props: {
  },
  data() {
    return {
      foo: 42,
      stories: [],
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
    ]),
    ...mapActions("search", [
    ]),
    ...mapActions("user", []),
    getStories(){
      console.log("getStories")
      this.isLoading = true
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