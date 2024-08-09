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
          v-model="queryString"
          autofocus
          label="OQL"
          outlined
          clearable
          auto-grow
          rounded
          rows="1"
          placeholder="Enter your OQL here"
          @keydown.ctrl.enter="setQueryString"
          @keydown.meta.enter="setQueryString"
          @keydown.tab="tab"
      >
      </v-textarea>
      <v-btn x-large color="primary" rounded @click="setQueryString" class="px-4 mb-8 ml-2 fill-height"
             style="min-width: 0;">
        <v-icon>mdi-magnify</v-icon>
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
  props: {
    canonicalQueryString: String,
  },
  data() {
    return {
      foo: 42,
      queryString: "",
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
    cleanQueryString() {
      const normalizeNewlines = (str) => str.replace(/\r\n|\r|\n/g, '\n');
      const removeRedundantSpaces = (str) => str.replace(/[^\S\n]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
      return removeRedundantSpaces(
          normalizeNewlines(this.queryString)
      )
    }

  },

  methods: {
    ...mapMutations([
      "snackbar",

    ]),
    ...mapActions([
        "createSearch",
    ]),
    ...mapActions("user", []),
    async setQueryString() {
      await this.createSearch(this.cleanQueryString)
    },
    async getAutocompleteSuggestions() {
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
    tab() {
      if (this.autocompleteSuggestions.length > 0) {
        this.replaceLastWord(this.autocompleteSuggestions[0])

        return false
      }
    },
    replaceLastWord(newWord) {
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
    canonicalQueryString: {
      handler: function (value) {
        this.queryString = value
      },
      immediate: true
    },
  }
}
</script>

<style scoped lang="scss">

</style>