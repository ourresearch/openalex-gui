<template>
  <v-card flat rounded>
    <v-tabs v-model="tab"> 
      <v-tab>Query Object</v-tab>
      <v-tab>OQL</v-tab>
      <v-tab>SQL</v-tab>
      <v-tab>API</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab" style="padding: 10px; border-radius: 15px;"> 
      <v-tab-item>
        <v-card-text>
          <pre>{{ query }}</pre>
        </v-card-text>
      </v-tab-item>
      
      <v-tab-item>
        <search-from-text :disabled="!queryIsCompleted" />
      </v-tab-item>

      <v-tab-item>
        <v-card-text>
          <pre class="sql">{{ formattedSql }}</pre>
        </v-card-text>
      </v-tab-item>

      <v-tab-item>
        <a class="api-link" :href="searchApiUrl" target="_blank">{{ searchApiUrl }}</a>
      </v-tab-item>
    </v-tabs-items>
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
    applyOql() {
      this.isOqlEditDialogOpen = false;
      this.createSearchFromOql(this.oql);
    },
    searchApiUrl() {
      return urlBase.api + '/searches/' + this.$route.params.id;
    },
    formattedSql() {
      const rawSql = this.querySql;
      if (!rawSql) { return ""; }
      return format(rawSql, {language: "redshift"});
    }
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
