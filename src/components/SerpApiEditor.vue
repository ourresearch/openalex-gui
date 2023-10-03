<template>
  <div>
    <v-card>
<!--      <v-toolbar dense color="transparent" flat>-->
<!--        <v-toolbar-title>-->
<!--          <v-icon left>mdi-api</v-icon>-->
<!--          API Query-->
<!--        </v-toolbar-title>-->
<!--        <v-spacer/>-->
<!--        <v-btn-->
<!--            icon-->
<!--            @click="copyToClipboard(apiUrl)"-->
<!--        >-->
<!--          <v-icon>mdi-content-copy</v-icon>-->
<!--        </v-btn>-->
<!--        <v-btn icon @click="$emit('close')">-->
<!--          <v-icon>mdi-close</v-icon>-->
<!--        </v-btn>-->
<!--      </v-toolbar>-->
      <v-card-text>
        <v-textarea
            v-if="0"
            readonly
            outlined
            v-model="apiUrl"
            background-color="#444"
            dark
            rows="1"
            class="pa-1"
            style="font-family: Monaco, monospace; font-size:16px;"
            append-icon="mdi-content-copy"
            prepend-icon="mdi-api"
            @click:append="copyToClipboard(apiUrl)"
        >
        </v-textarea>
        <v-card
            style="font-family: Monaco, monospace; font-size:16px;"
            color="#444"
            dark
            class="pa-3"
        >
          {{ apiUrl }}
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
  },
  data() {
    return {
      foo: 42,
      apiUrl: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("URL copied to clipboard.")
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route": {
      immediate: true,
      handler(to, from){
        this.apiUrl = to.fullPath
      }
    }

  }
}
</script>

<style scoped lang="scss">

</style>