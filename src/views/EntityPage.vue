<template>
  <div class="color-2" style="min-height: 80vh">
    <v-container v-if="entityData" class="entity-page">
      <div>
        <v-btn
            color="primary"
            rounded
            class="my-2"
            variant="text"
            @click="$router.back()"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          back
        </v-btn>
      </div>
      <entity-header
          :entity-data="entityData"
          class="mb-4"
      />
      <v-row v-if="myEntityType === 'works'">
        <v-col>
          <v-card flat rounded class="py-6">
            <entity-new
                :data="entityData"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12" md="7">
          <v-card flat class="rounded-o py-6">
            <entity-new
                :data="entityData"
            />
          </v-card>

          <v-card flat class="rounded-o mt-3">
            <v-toolbar flat color="white" class="entity-page-section-title">
              <template #prepend>
                <v-icon variant="text" color="grey-darken-2" start>mdi-file-document-outline</v-icon>
              </template>
              <v-toolbar-title class="font-weight-bold">
                Top works
              </v-toolbar-title>
              <v-spacer/>
              <v-btn color="primary" rounded variant="text" @click="viewMyWorks">
                View all
              </v-btn>
            </v-toolbar>
            <v-list>
              <serp-results-list-item
                  v-for="result in worksResultObject.results"
                  :key="result.id"
                  :result="result"
              />
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card flat class="rounded-o px-2 pb-3">
            <v-toolbar flat color="white" class="entity-page-section-title">
              <template #prepend>
                <v-icon variant="text" color="grey-darken-2" start>mdi-clipboard-outline</v-icon>
              </template>
              <v-toolbar-title class="font-weight-bold">
                Key stats
              </v-toolbar-title>
              <v-spacer/>
            </v-toolbar>
            <group-by
                v-for="groupByKey in groupByKeys"
                :key="groupByKey"
                :filter-key="groupByKey"
                :filter-by="[myWorksFilter]"
                entity-type="works"
                :is-entity-page="true"
                class="mb-3"
            />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>

import {mapGetters} from "vuex";
import { useHead } from '@unhead/vue';

import {api} from "@/api";
import {url} from "@/url";
import filters from "@/filters";
import {getEntityConfig} from "@/entityConfigs";
import {shortenOpenAlexId} from "@/util";
import {createSimpleFilter, filtersAsUrlStr} from "@/filterConfigs";

import EntityNew from "@/components/Entity/EntityNew.vue";
import EntityHeader from "@/components/Entity/EntityHeader.vue";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";
import GroupBy from "@/components/GroupBy/GroupBy.vue";

export default {
  name: "EntityPage",
  components: {
    EntityNew,
    SerpResultsListItem,
    GroupBy,
    EntityHeader,
  },
  props: {},
  data() {
    return {
      entityData: null,
      myEntityType: null,
      worksResultObject: {},
    }
  },
  computed: {
    ...mapGetters([
      "globalIsLoading",
    ]),
    myEntityConfig() {
      return getEntityConfig(this.myEntityType);
    },
    myEntityComponentName() {
      return "entity-" + filters.pluralize(this.$route.params.entityType, 1);
    },
    myEntityName() {
      return this.$route.params.entityType;
    },
    myWorksFilter() {
      return createSimpleFilter(
          "works",
          this.myEntityConfig.filterKey,
          this.$route.params.entityId
      );
    },
    apiPath() {
      return [
        this.$route.params.entityType,
        this.$route.params.entityId
      ].join("/");
    },
    isDataMatchingId() {
      const loadedId = shortenOpenAlexId(this.entityData?.id);
      const requestedId = this.$route.params.entityId;
      return loadedId === requestedId;
    },
    groupByKeys() {
      return [
        "publication_year",
        "open_access.is_oa",
        "primary_topic.id",
        "type",
      ];
    }
  },
  methods: {
    async getEntityData() {
      this.$store.state.isLoading = true;
      this.entityData = await api.get(this.apiPath);
      this.$store.state.isLoading = false;
    },
    async getWorks() {
      this.worksResultObject = {};
      if (this.myEntityType === 'works') return;
      if (!this.myEntityConfig) return;
      const myWorksFilter = createSimpleFilter(
          "works",
          this.myEntityConfig.filterKey,
          this.$route.params.entityId,
      );
      const filterString = filtersAsUrlStr([myWorksFilter]);
      const apiUrl = api.makeUrl(
          "works",
          {
            filter: filterString,
            sort: "cited_by_count:desc",
            "per-page": 7,
          },
          true
      );
      console.log("getWorks() calling this url", apiUrl);
      const resp = await api.getResultsList(apiUrl);
      console.log("getWorks() got response back", resp);
      this.worksResultObject = resp;
    },
    viewMyWorks() {
      console.log(this.myWorksFilter);
      return url.pushNewFilters([this.myWorksFilter], "works");
    },
  },
  created() {
    useHead({ title: this.entityData?.display_name });
  },
  async mounted() {
    console.log("EntityPage mounted", this.$route.params.entityType, this.$route.params.entityId);
    this.$store.state.entityType = this.$route.params.entityType;
  },
  watch: {
    'apiPath': {
      immediate: true,
      async handler() {
        this.myEntityType = this.$route.params.entityType;
        this.getEntityData();
        this.getWorks();
      }
    }
  }
}
</script>

<style lang="scss">
.entity-page-section-title .v-toolbar__content {
  margin-inline-start: 0px !important;
  padding: 4px 12px !important;
}
.entity-page-section-title .v-toolbar-title {
  margin-inline-start: 0px !important;
}
.entity-page  .v-list .v-list-item--active {
  color: #1976d2; // primary
}
</style>