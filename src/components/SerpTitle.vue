<template>
  <div class="d-flex">
    <div class="text-h6 ml-5 pb-1">
      {{ activeSearchDescription || "Unsaved search" }}
    </div>

<!--    <v-btn icon to="/me/searches" v-if="userId" class="ml-3">-->
<!--      <v-icon>mdi-folder-outline</v-icon>-->
<!--    </v-btn>-->
<!--    <v-menu offset-y>-->
<!--      <template v-slot:activator="{on}">-->
<!--        <v-btn-->
<!--            v-on="on"-->
<!--            text-->
<!--            rounded-->
<!--            class="text-h6 "-->
<!--        >-->
<!--          {{ activeSearchDescription || "Unsaved search" }}-->
<!--          <v-icon class="ml-1">mdi-menu-down</v-icon>-->
<!--        </v-btn>-->
<!--      </template>-->
<!--      <saved-search-menu-->
<!--          :id="$route.query.id"-->
<!--          @save="clickSaveButton"-->
<!--      />-->
<!--    </v-menu>-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";

export default {
  name: "Template",
  components: {
    SavedSearchMenu,
  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "activeSearchDescription",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    clickSaveButton() {

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