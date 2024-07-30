<template>
  <div>
<!--    <div class="mb-2">-->
<!--      <v-chip-->
<!--        v-for="suggestion in autocompleteSuggestions"-->
<!--        :key="suggestion"-->
<!--        outlined-->
<!--        class="mr-1"-->
<!--        @click="replaceLastWord(suggestion)"-->
<!--      >-->
<!--        {{ suggestion}}-->
<!--      </v-chip>-->
<!--    </div>-->

    <div class="d-flex align-end">
      <v-textarea
          v-model="query"
          autofocus
          label="OQL"
          outlined
          clearable
          auto-grow
          rounded
          rows="1"
          placeholder="Enter your OQL here"
          @keydown.ctrl.enter="search"
          @keydown.meta.enter="search"
          @keydown.tab="tab"
      >
      </v-textarea>
      <v-btn x-large color="primary" rounded @click="search" class="px-4 mb-8 ml-2 fill-height" style="min-width: 0;">
        <v-icon >mdi-magnify</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      query: "",
      autocompleteSuggestions: [],
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),

  },

  methods: {
    ...mapMutations([
      "snackbar",

    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    async search() {


      const q = (this.query) ?
          this.query :
          undefined
      const newRoute = {name: "results", query: {q}}
      await this.$router.push(newRoute)
          .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
              throw e
            }
          })
    },
    async getAutocompleteSuggestions(){
      const q = this.query ?? ""
      const url = "https://api.openalex.org/query?q=" + q
      try {
        const resp = await axios.get(url)
        this.autocompleteSuggestions = resp.data.autocomplete.suggestions
        console.log("getAutocompleteSuggestions", resp.data)
      } catch (e) {
        console.error(e)
        return
      }
    },
    tab(){
      if (this.autocompleteSuggestions.length > 0){
        this.replaceLastWord(this.autocompleteSuggestions[0])

        return false
      }
    },
    replaceLastWord(newWord){
      const words = this.query.split(" ")
      words.pop()
      words.push(newWord)
      this.query = words.join(" ") + " "
      setTimeout(() => {
        const textArea = document.getElementsByTagName("textarea")[0]
        textArea.focus()
        textArea.selectionStart = textArea.value.length
      }, 0);

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.q": {
      handler: function (value) {
        this.query = value
      },
      immediate: true
    },
    query: {
      handler: function (value) {
        // this.getAutocompleteSuggestions()
      },
      immediate: false
    }
  }
}
</script>

<style scoped lang="scss">

</style>