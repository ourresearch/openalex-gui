<template>
  <div>
    <v-textarea
        v-model="queryString"
        autofocus
        variant="filled"
        clearable
        auto-grow
        rounded
        rows="3"
        placeholder="Enter your OQL here"
        @keydown.ctrl.enter="setQueryString"
        @keydown.meta.enter="setQueryString"
        @keydown.tab="tab"
        hide-details
    >
    </v-textarea>
    <div class="d-flex pr-4">
      <v-spacer></v-spacer>
      <v-btn
          color="primary"
          rounded="circle"
          size="small"
          @click="setQueryString"
          class=""
          style="margin-top:-22px;"
      >
        <v-icon>mdi-arrow-{{ arrowDirection }}</v-icon>
      </v-btn>

    </div>
  </div>
</template>


<script>

import {mapActions} from "vuex";

export default {
  name: "OqlBox",
  components: {},
  props: {
    canonicalQueryString: String,
    arrowDirection: {
      type: String,
      default: "down"
    }
  },
  data() {
    return {
      queryString: "",
      autocompleteSuggestions: [],
    }
  },
  computed: {
    cleanQueryString() {
      const normalizeNewlines = (str) => str.replace(/\r\n|\r|\n/g, '\n');
      const removeRedundantSpaces = (str) => str.replace(/[^\S\n]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
      return removeRedundantSpaces(
          normalizeNewlines(this.queryString)
      )
    }
  },
  methods: {
    ...mapActions("search", [
        "createSearch",
    ]),
    async setQueryString() {
      await this.createSearch(this.cleanQueryString)
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

    },
  },
  watch: {
    canonicalQueryString: {
      handler: function (value) {
        this.queryString = value
      },
      immediate: true
    },
    queryString: {
      handler: function () {
        // const autocomplete = parseOQL(
        //     value,
        // )
        // console.log("queryString changed", value, autocomplete)
      }
      },
      immediate: true

  }
}
</script>

<style scoped lang="scss">

</style>