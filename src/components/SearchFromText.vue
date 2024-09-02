<template>
  <v-textarea
      v-model="q"
      :disabled="isNatLangLoading || disabled"
      autofocus
      auto-grow
      filled
      rounded
      hide-details
      rows="2"
      :placeholder="placeholder"
      @keydown.enter.exact.prevent="applyQ"
      :class="{oql: selectedInputType === 'oql'}"
  >
<!--      prepend-inner-icon="mdi-code-parentheses-box"-->
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
    <template v-slot:prepend-inner>
      <v-menu rounded max-width="300" offset-y>
        <template v-slot:activator="{ on }">
          <v-btn
              large
              v-on="on"
              style="margin: -11px 0 0 -19px; min-width: 1px; border-radius: 10px;"
              class="pl-1 pr-0"
              text
          >
            <v-icon >{{ inputTypes.find(it => it.id === selectedInputType).icon }}</v-icon>
<!--            {{ inputTypes.find(it => it.id === selectedInputType).displayName }}-->
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
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
    </template>
  </v-textarea>
</template>

<script>
import axios from "axios";
import {mapActions, mapGetters} from "vuex";

export default {
  name: 'SearchFromText',
  props: {
    resetQuery: Boolean,
    disabled: Boolean,
    selected: String,
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
          displayName: "OQL",
          icon: "mdi-code-parentheses-box",
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
      ]
    }
  },
  computed: {
    ...mapGetters("search", [
    ]),
    placeholder() {
      return this.selectedInputType === "natural-language" ?
          "Enter natural language query" :
          "Enter OQL query"
    }
  },
  methods: {
    ...mapActions("search", [
      "setFromQueryObject",
      "createSearch",
      "createSearchFromOql",
    ]),
    applyQ() {
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
    applyOql() {
      this.isNatLangLoading = true;
      this.createSearchFromOql(this.q);
      this.isNatLangLoading = false
    }
  },
  mounted() {
      this.selectedInputType = this.selected
  },
  watch: {
    resetQuery() {
      this.q = "";
    },
    "$store.state.search.oql": {
      handler: function (newVal) {
        if (this.selectedInputType === "oql") {
          this.q = newVal;
        }
      },
      immediate: true
    },
    selectedInputType() {
      if (this.selectedInputType === "natural-language") {
        this.q = "";
      }
      else {
        this.q = this.$store.state.search.oql;
      }
    }

  }
}
</script>
<style lang="scss">
textarea {
  //padding-top: 5px !important;
  margin-bottom: 15px;
}
.v-text-field--rounded {
    border-radius: 15px !important;
}
.oql {
  textarea {
    font-family: "Consolas", monospace !important;
    font-size: 14px !important;
    line-height: 1.5 !important;

  }

}
</style>