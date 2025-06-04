<template>
  <v-textarea
      v-model="q"
      :disabled="isNatLangLoading || disabled"
      autofocus
      auto-grow
      variant="filled"
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
          size="large" icon style="margin-top: -11px; margin-right: -13px;"
          @click="applyQ"
          :disabled="isNatLangLoading"
          :loading="isNatLangLoading"
      >
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </template>
    <template v-if="naturalLanguage" v-slot:prepend-inner>
      <v-menu class="rounded-lg" max-width="300" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
              size="large"
              v-bind="props"
              style="margin: -11px 0 0 -19px; min-width: 1px; border-radius: 10px;"
              class="pl-1 pr-0"
              variant="text"
          >
            <v-icon>{{ inputTypes.find(it => it.id === selectedInputType).icon }}</v-icon>
            <!--            {{ inputTypes.find(it => it.id === selectedInputType).displayName }}-->
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
              v-for="inputType in inputTypes"
              :key="inputType.id"
              :active="selectedInputType === inputType.id"
              @click="selectedInputType = inputType.id"
          >
            <v-icon>{{ inputType.icon }}</v-icon>
            
            <v-list-item-title>{{ inputType.displayName }}</v-list-item-title>
            <v-list-item-subtitle class="white-space-normal">
              {{ inputType.description }}
            </v-list-item-subtitle>

          </v-list-item>

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
    disabled: Boolean,
    selected: String,
    naturalLanguage: Boolean,

  },
  data() {
    return {
      q: "",
      isNatLangLoading: false,
      selectedInputType: "oql",
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
    "queryOql"]),
    placeholder() {
      return this.selectedInputType === "natural-language" ?
          "Enter natural language query" :
          "Enter OQL query"
    }
  },
  methods: {
    ...mapActions("search", [
      "createSearch",
      "createSearchFromOql",
      "createSearchFromQuery",
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

      this.createSearchFromQuery(resp.data);
    },
    applyOql() {
      this.isNatLangLoading = true;
      this.createSearchFromOql(this.q);
      this.isNatLangLoading = false
    }
  },
  mounted() {
  },
  watch: {
    "queryOql": {
      handler: function (newVal) {
        if (this.selectedInputType === "oql") {
          this.q = newVal
        }
      },
      immediate: true
    },
    selectedInputType() {
      if (this.selectedInputType === "natural-language") {
        this.q = "";
      } else {
        this.q = this.queryOql;
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