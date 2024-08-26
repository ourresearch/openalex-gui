<template>
  <div style="max-width: 800px; margin: 0 auto;" class="d-flex ">
    <div class="flex-grow-1">
      <v-textarea
          v-model="natLangQuery"
          :disabled="isNatLangLoading"
          autofocus
          auto-grow
          filled
          dense
          rounded
          hide-details
          rows="1"
          placeholder="Search the research ecosystem with natural language"
          @keydown.enter.exact.prevent="createSearchFromNatLang"
      >
        <template v-slot:append>
          <v-btn
              large icon style="margin-top: -11px; margin-right: -13px;"
              @click="createSearchFromNatLang"
              :disabled="isNatLangLoading"
              :loading="isNatLangLoading"
          >
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>
      </v-textarea>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { mapActions } from "vuex";

export default {
  name: 'NatLangSearch',
  data() {
    return {
      natLangQuery: "",
      isNatLangLoading: false,
    }
  },
  methods: {
    ...mapActions("search", [
      "setFromQueryObject",
      "createSearch",
    ]),
    async createSearchFromNatLang() {
      this.isNatLangLoading = true;
      console.log("createSearchFromNatLang", this.natLangQuery);
      const myURl = `https://api.openalex.org/text/oql?natural_language=${this.natLangQuery}`;
      const resp = await axios.get(myURl);
      console.log("resp", resp);
      this.isNatLangLoading = false;

      this.setFromQueryObject(resp.data);
      this.createSearch();
    }
  }
}
</script>