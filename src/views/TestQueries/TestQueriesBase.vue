<template>
  <div>
    <v-container class="mt-6" >
      <div>
        <v-breadcrumbs
            class="ma-0 pa-0"
            :items="breadcrumbItems"
            large
        >
          <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </div>
      <div class="text-h4 mb-5 mt-3">{{ pageTitle }}</div>
    </v-container>
    <router-view />
  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "TestQueriesBase",
  components: {
  },
  props: {},
  data() {
    return {
    }
  },
  computed: {
    breadcrumbItems() {
      // /tests/:testSuiteId/:queryId/:testType/:testId

      const items = [
        {text: 'Tests', to: '/tests', exact: true,}
      ];

      if (this.$route.params.testSuiteId) {
        items.push({
          text: `Suite: ${this.$route.params.testSuiteId}`,
          exact: true,
          to: `/tests/${this.$route.params.testSuiteId}`
        });
      }

      if (this.$route.params.queryId) {
        items.push({
          text: `Query: ${this.$route.params.queryId}`,
          exact: true,
          to: `/tests/${this.$route.params.testSuiteId}/${this.$route.params.queryId}`
        });
      }

      if (this.$route.params.testType) {
        items.push({
          text: `${this.$route.params.testType}`,
          exact: true,
          to: `/tests/${this.$route.params.testSuiteId}/${this.$route.params.queryId}/${this.$route.params.testType}`
        });
      }

      if (this.$route.params.testId) {
        items.push({
          text: `${this.$route.params.testId}`,
          exact: true,
          to: `/tests/${this.$route.params.testSuiteId}/${this.$route.params.queryId}/${this.$route.params.testType}/${this.$route.params.testId}`
        });
      }
      return items
    },
    pageTitle(){
      // get the last item in the breadcrumbs list
      return this.breadcrumbItems[this.breadcrumbItems.length - 1].text
    }
  },
  methods: {
  },
}
</script>

<style scoped lang="scss">

</style>