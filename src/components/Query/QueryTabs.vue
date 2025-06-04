<template>
  <v-card flat rounded>
    <v-tabs v-model="tab">
      <v-tab value="0">Query Object</v-tab>
      <v-tab value="1">OQL</v-tab>
      <v-tab value="2">SQL</v-tab>
      <v-tab value="3">API</v-tab>
    </v-tabs>

    <v-window v-model="tab" style="padding: 10px; border-radius: 15px;">
      <v-window-item value="0">
        <v-card-text>
          <pre>{{ query }}</pre>
        </v-card-text>
      </v-window-item>
      <v-window-item value="1">
        <search-from-text :disabled="!queryIsCompleted" />
      </v-window-item>
      <v-window-item value="2">
        <v-card-text>
          <pre class="sql">{{ formattedSql }}</pre>
        </v-card-text>
      </v-window-item>
      <v-window-item value="3">
        <a class="api-link" :href="searchApiUrl" target="_blank">{{ searchApiUrl }}</a>
      </v-window-item>
    </v-window>
    <v-spacer />
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { format } from 'sql-formatter';
import { urlBase } from "@/apiConfig";
import SearchFromText from "@/components/SearchFromText.vue";

export default {
  name: "QueryTabs",
  components: {
    SearchFromText
  },
  data() {
    return {
      tab: 0,
      isOqlEditDialogOpen: false,
      oql: "",
    }
  },
  computed: {
    ...mapGetters("search", [
      "query",
      "queryIsCompleted",
      "querySql",
      "queryOql"
    ]),
    ...mapActions("search", [
      "createSearchFromOql",
    ]),
    searchApiUrl() {
      return urlBase.api + '/analytics/' + this.$route.params.id;
    },
    formattedSql() {
      const rawSql = this.querySql;
      if (!rawSql) { return ""; }
      return format(rawSql, {language: "redshift"});
    }
  },
  methods: {
    applyOql() {
      this.isOqlEditDialogOpen = false;
      this.createSearchFromOql(this.oql);
    },
  },
  watch: {
    isOqlEditDialogOpen() {
      this.oql = this.queryOql;
    }
  }
}
</script>

<style scoped>
.api-link {
  display: block;
  padding: 16px;
  word-break: break-all;
}
.sql {
  white-space: pre-wrap;
  overflow-x: scroll;
}
.v-tabs {
  padding: 0 20px;
}
.v-tab {
  text-transform: none;
}
</style>
