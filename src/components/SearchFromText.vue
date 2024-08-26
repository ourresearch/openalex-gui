<template>
  <v-card :loading="isNatLangLoading" flat rounded max-width="800">
    <v-card-title class="d-flex align-baseline">
      Search OpenAlex
      <v-spacer></v-spacer>
      <v-menu rounded max-width="300">
        <template v-slot:activator="{ on }">
          <v-btn small text rounded v-on="on">
            {{ inputTypes.find(it => it.id === selectedInputType).displayName }}
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-subheader>How do you want to search?</v-subheader>
          <v-list-item-group
            v-model="selectedInputType"
            mandatory
            active-class="primary--text"
          >
            <v-list-item
                v-for="inputType in inputTypes"
                :key="inputType.id"
                :value="inputType.id"
            >
              <v-list-item-icon>
                <v-icon>{{ inputType.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ inputType.displayName }}</v-list-item-title>
                <v-list-item-subtitle class="white-space-normal">
                    {{ inputType.description }}
                </v-list-item-subtitle>

              </v-list-item-content>
            </v-list-item>

          </v-list-item-group>
        </v-list>
      </v-menu>
    </v-card-title>
    <div class="flex-grow-1 mx-4 pb-4">
      <v-textarea
          v-model="q"
          :disabled="isNatLangLoading"
          autofocus
          auto-grow
          filled
          dense
          rounded
          hide-details
          rows="1"
          placeholder="Search the research ecosystem with natural language"
          @keydown.enter.exact.prevent="applyQ"
      >
        <template v-slot:append>
          <v-btn
              large icon style="margin-top: -11px; margin-right: -13px;"
              @click="applyQ"
              :disabled="isNatLangLoading"
              :loading="isNatLangLoading"
          >
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>
      </v-textarea>
    </div>
  </v-card>
</template>

<script>
import axios from "axios";
import {mapActions} from "vuex";

export default {
  name: 'SearchFromText',
  props: {
    resetQuery: Boolean,
  },
  data() {
    return {
      q: "",
      isNatLangLoading: false,
      selectedInputType: "natural-language",
      inputTypes: [
        {
          id: "natural-language",
          displayName: "Natural language",
          icon: "mdi-message-text",
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        {
          id: "oql",
          displayName: "OpenAlex Query Language",
          icon: "mdi-code-parentheses",
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
      ]
    }
  },
  methods: {
    ...mapActions("search", [
      "setFromQueryObject",
      "createSearch",
      "createSearchFromOql",
    ]),
    applyQ(){
      return (this.selectedInputType === "natural-language") ?
          this.applyNatLang() :
          this.applyOql();
    },
    async applyNatLang() {
      this.isNatLangLoading = true;
      console.log("applyNatLang", this.q);
      const myURl = `https://api.openalex.org/text/oql?natural_language=${this.q}`;
      const resp = await axios.get(myURl);
      this.isNatLangLoading = false;

      this.setFromQueryObject(resp.data);
      this.createSearch();
    },
    applyOql(){
      this.isNatLangLoading = true;
      this.createSearchFromOql(this.q);
      this.isNatLangLoading = false
    }
  },
  watch: {
    resetQuery() {
      this.q = "";
    }
  }
}
</script>