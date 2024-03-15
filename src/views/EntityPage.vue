<template>
  <div class="color-2" style="min-height: 80vh">
    <v-container v-if="entityData" class="">
      <div>
        <v-btn
            color="primary"
            rounded
            class="my-2"
            text
            @click="$router.back()"
        >
          <v-icon left>mdi-arrow-left</v-icon>
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
          <v-card flat rounded class="py-6">
            <entity-new
                :data="entityData"
            />
          </v-card>
          <v-card flat rounded class="mt-3">
            <v-toolbar flat>
              <v-icon left>mdi-file-document-outline</v-icon>
              <v-toolbar-title class="font-weight-bold">
                Top works
              </v-toolbar-title>
              <v-spacer/>
              <v-btn color="primary" rounded text @click="viewMyWorks">
                View all
              </v-btn>
            </v-toolbar>
            <v-list>
              <serp-results-list-item-work
                  v-for="result in worksResultObject.results"
                  :key="result.id"
                  :result="result"
              />
            </v-list>
          </v-card>
        </v-col>
        <!--        <v-col cols="12" md="4">-->
        <!--        </v-col>-->
        <v-col cols="12" md="5">
          <v-card flat rounded class="px-2 pb-3">
            <v-toolbar flat>
              <v-icon left>mdi-clipboard-outline</v-icon>
              <v-toolbar-title class="font-weight-bold">
                Key stats
              </v-toolbar-title>
              <v-spacer/>
              <!--              <v-btn color="primary" rounded text @click="viewMyWorks">-->
              <!--                View more-->
              <!--              </v-btn>-->
            </v-toolbar>
            <group-by
                v-for="groupByKey in groupByKeys"
                :key="groupByKey"
                :filter-key="groupByKey"
                :filter-by="[myWorksFilter]"
                entity-type="works"
                class="mb-3"
            />
          </v-card>
        </v-col>

      </v-row>

      <!--      <entity-body-->
      <!--          :data="entityData"-->
      <!--          :type="myEntityType"-->
      <!--          v-if="entityData && myEntityType"-->
      <!--      />-->


      <!--    <template v-if="isDataMatchingId">-->
      <!--      <entity-work v-if="myEntityName === 'works'" :data="entityData" />-->
      <!--      <entity-body v-else :data="entityData" />-->

      <!--    </template>-->

      <!--    <component-->
      <!--        class=""-->
      <!--        :is="myEntityComponentName"-->
      <!--        :data="entityData"-->
      <!--        v-if="isDataMatchingId"-->
      <!--    />-->
    </v-container>
    <entity-drawer />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

import EntityNew from "@/components/Entity/EntityNew.vue";
import SerpResultsListItemWork from "@/components/SerpResultsListItem.vue";
import WorkLinkouts from "@/components/WorkLinkouts.vue";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";

import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {createSimpleFilter, filtersAsUrlStr} from "@/filterConfigs";
import GroupBy from "@/components/GroupBy/GroupBy.vue";
import {url} from "@/url";
import EntityHeader from "@/components/Entity/EntityHeader.vue";
import EntityDrawer from "@/components/Entity/EntityDrawer.vue";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "EntityPage",
  metaInfo() {
    return {title: this.entityData?.display_name}
  },
  components: {
    EntityNew,
    SerpResultsListItemWork,
    WorkLinkouts,
    GroupBy,
    LinkEntityRolesList,
    EntityHeader,

    EntityDrawer,

  },
  props: {},
  data() {
    return {
      foo: 42,
      entityData: null,
      myEntityType: null,
      worksResultObject: {},
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "globalIsLoading",
    ]),
    ...mapGetters("user", [
      "userId",
      "userName",
      "userEmail",
      "userEmailAlerts",
      "userSavedSearches",
    ]),
    myEntityConfig() {
      return getEntityConfig(this.myEntityType)
    },
    myEntityComponentName() {
      return "entity-" + this.$pluralize(
          this.$route.params.entityType,
          1
      )
    },
    myEntityName() {
      return this.$route.params.entityType
    },
    myWorksFilter() {
      return createSimpleFilter(
          "works",
          this.myEntityConfig.filterKey,
          this.$route.params.entityId
      )
    },
    apiPath() {
      return [
        this.$route.params.entityType,
        this.$route.params.entityId
      ].join("/")
    },
    isDataMatchingId() {
      const loadedId = shortenOpenAlexId(this.entityData?.id)
      const requestedId = this.$route.params.entityId
      return loadedId === requestedId
    },
    groupByKeys() {
      return [
        "publication_year",
        "open_access.is_oa",
        "primary_topic.id",
        "type",
      ]
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async getEntityData() {
      this.$store.state.isLoading = true
      this.entityData = await api.get(this.apiPath)
      this.$store.state.isLoading = false
    },
    async getWorks() {
      this.worksResultObject = {}
      if (this.myEntityType === 'works') return
      if (!this.myEntityConfig) return
      const myWorksFilter = createSimpleFilter(
          "works",
          this.myEntityConfig.filterKey,
          this.$route.params.entityId,
      )
      const filterString = filtersAsUrlStr([myWorksFilter])
      const apiUrl = api.createUrl(
          "works",
          {
            filter: filterString,
            sort: "cited_by_count:desc",
            "per-page": 3,
          },
          true
      )
      console.log("getWorks() calling this url", apiUrl)
      const resp = await api.getResultsList(apiUrl)
      console.log("getWorks() got response back", resp)
      this.worksResultObject = resp
    },
    viewMyWorks() {
      return url.pushNewFilters([this.myWorksFilter])
    },
  },
  created() {
  },
  async mounted() {
    console.log("EntityPage mounted", this.$route.params.entityType, this.$route.params.entityId)
    this.$store.state.entityType = this.$route.params.entityType
    // const path = [
    //   this.$route.params.entityType,
    //   this.$route.params.entityId
    // ].join("/")
    // this.entityData = await api.get(path)
  },
  watch: {
    'apiPath': {
      immediate: true,
      async handler(to, from) {
        this.myEntityType = this.$route.params.entityType
        this.getEntityData()
        this.getWorks()
      }
    }
  }
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>