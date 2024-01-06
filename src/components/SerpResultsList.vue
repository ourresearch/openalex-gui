<template>
  <v-card flat rounded class="py-3">
    <v-list rounded>
      <v-list-item
          v-for="result in resultsObject.results"
          :key="result.id"
          :to="result.id | entityZoomLink"
          class="pl-0"
      >
        <v-list-item-icon>
          <v-icon class="pt-1">mdi-file-document-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title style="white-space: normal; line-height: 1.5;">
            <div>{{ result.display_name }}</div>
          </v-list-item-title>
          <v-list-item-subtitle style="white-space: normal; line-height: 1.5;">
            <div>
              <span v-if="result.publication_year">{{ result.publication_year }}</span>
              <span v-if="result.publication_year && result.type"> · </span>
              <work-authors-string v-if="result.authorships?.length" :authorships="result.authorships" />
              <span v-if="result.primary_location?.source?.display_name"> · </span>
              <span v-if="result.primary_location?.source?.display_name" class="font-italic">
                  {{ result.primary_location?.source?.display_name }}
                </span>
            </div>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import WorkAuthorsString from "@/components/WorkAuthorsString.vue";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "Template",
  components: {
    WorkAuthorsString,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),



  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>