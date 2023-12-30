<template>
  <v-container>
    <div class="d-flex">
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
      <v-spacer />
      <v-btn icon :href="'https://api.openalex.org/' + apiPath" target="_blank">
        <v-icon>mdi-api</v-icon>
      </v-btn>

    </div>
      <entity-body v-if="isDataMatchingId" :data="entityData" />

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
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Entity from "@/components/Entity/Entity.vue";
import EntityWork from "@/components/Entity/EntityWork.vue";
import EntityAuthor from "@/components/Entity/EntityAuthor.vue";
import EntitySource from "@/components/Entity/EntitySource.vue";
import EntityPublisher from "@/components/Entity/EntityPublisher.vue";
import EntityFunder from "@/components/Entity/EntityFunder.vue";
import EntityInstitution from "@/components/Entity/EntityInstitution.vue";
import EntityConcept from "@/components/Entity/EntityConcept.vue";


import {api} from "@/api";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";
import EntityBody from "@/components/Entity/EntityBody.vue";

export default {
  name: "EntityPage",
  metaInfo() {
    return {title: this.entityData?.display_name}
  },
  components: {
    EntityBody,
    Entity,
    EntityWork,
    EntityAuthor,
    EntitySource,
    EntityPublisher,
    EntityFunder,
    EntityInstitution,
    EntityConcept,
  },
  props: {},
  data() {
    return {
      foo: 42,
      entityData: null,
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
    myEntityComponentName() {
      return "entity-" + this.$pluralize(
          this.$route.params.entityType,
          1
      )
    },
    myEntityName(){
      return this.$route.params.entityType
    },
    apiPath() {
      return [
        this.$route.params.entityType,
        this.$route.params.entityId
      ].join("/")
    },
    isDataMatchingId(){
      const loadedId = shortenOpenAlexId(this.entityData?.id)
      const requestedId = this.$route.params.entityId
      return loadedId === requestedId
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  async mounted() {
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
        console.log("entityid change", this.apiPath)
        this.entityData = await api.get(this.apiPath)
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