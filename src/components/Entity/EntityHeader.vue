<template>
  <div>
    <div
        class="text-h6 text-lg-h5 mb-1"
        v-html="$prettyTitle(entityData.display_name)"
    />
    <div class="d-flex align-center">
      <link-entity-roles-list
          v-if="entityData.roles"
          :roles="entityData.roles"
          :selected="myEntityConfig.nameSingular"
          style="margin-left:-13px;"
      />
      <div class="mr-3" v-else>
        <v-icon small>{{ myEntityConfig.icon }}</v-icon>
        {{ myEntityConfig.displayNameSingular | capitalize }}
      </div>


      <!--          <div v-else-if="myEntityType !== 'works'" class="grey&#45;&#45;text">-->
      <!--            {{ myEntityConfig.displayNameSingular | capitalize }}-->
      <!--          </div>-->

    </div>
    <v-toolbar flat dense class="mt-4" style="margin-left: -20px;" color="transparent">
      <work-linkouts v-if="myEntityType === 'works'" :data="entityData"/>
      <v-btn v-else color="primary" rounded :to="entityData.id | entityWorksLink">
<!--        <v-icon left>mdi-file-document-outline</v-icon>-->
        View works
      </v-btn>
<!--      <entity-header-claim-profile-button-->
<!--          v-if="myEntityType === 'authors'"-->
<!--          :author-id="entityData.id"-->
<!--      />-->


      <v-tooltip bottom v-if="entityData.homepage_url">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" class="" icon :href="entityData.homepage_url" target="_blank">
            <v-icon>mdi-home-outline</v-icon>
          </v-btn>
        </template>
        Visit homepage
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{on}">
          <v-btn v-on="on" class="" icon :href="'https://api.openalex.org/' + shortId" target="_blank">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </template>
        View in API
      </v-tooltip>
      <v-tooltip bottom v-if="showPermalinkButton">
        <template v-slot:activator="{on}">
          <v-btn v-on="on" class="" icon :to="shortId">
            <v-icon>mdi-link</v-icon>
          </v-btn>
        </template>
        View permalink page
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon class="" :href="feebackUrl"
                 target="_blank">
            <v-icon>mdi-message-alert-outline</v-icon>
          </v-btn>
        </template>
        Send feedback
      </v-tooltip>
    </v-toolbar>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import WorkLinkouts from "@/components/WorkLinkouts.vue";
import EntityHeaderClaimProfileButton from "@/components/Entity/EntityHeaderClaimProfileButton.vue";
import {getEntityConfig} from "@/entityConfigs";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";

export default {
  name: "Template",
  components: {
    WorkLinkouts,
    LinkEntityRolesList,
    EntityHeaderClaimProfileButton,
  },
  props: {
    entityData: Object,
    showPermalinkButton: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    id() {
      return this.entityData.id
    },
    shortId() {
      return shortenOpenAlexId(this.id)
    },
    myEntityType() {
      return entityTypeFromId(this.id)
    },
    myEntityConfig() {
      return getEntityConfig(this.myEntityType)
    },
    feebackUrl() {
      const descriptionText = `<br /><br /><br />----------------<br />For internal use:<br />This is a support request originating from OpenAlex Web about entity: ${this.entityData.id}`
      return 'https://openalex.zendesk.com/hc/en-us/requests/new?tf_description=' + descriptionText
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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