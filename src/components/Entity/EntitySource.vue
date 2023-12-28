<template>
  <div>
    <v-container>
      <v-row>
        <v-col>
          <div class="text-h2">
            {{ data.display_name }}
          </div>
          <div class="capitalize-first-letter">
            {{ data.type }} hosted by
            <router-link :to="data.host_organization | entityZoomLink">
              {{ data.host_organization_name }}
            </router-link>
          </div>
          <div class="d-flex">
            <v-btn
                :to="data.id | entityWorksLink"
                color="primary"
                class="mr-3"
                rounded
            >
              Hosted works
            </v-btn>
            <v-btn
                :href="data.homepage_url"
                v-if="data.homepage_url"
                icon
                target="_blank"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>

          </div>

        </v-col>
      </v-row>


    </v-container>


    <div v-if="0" class="pa-3">
      <div class="data-row" v-if="data.host_organization_name">
        <template>
          <span v-if="data.type==='repository'" class="font-weight-bold">
            Institution:
          </span>
          <span v-else class="font-weight-bold">
            Publisher:
          </span>
        </template>
        <template>
          <span>
            <router-link
                :to="data.host_organization | entityZoomLink"
                class="text-decoration-none"
            >
              {{ data.host_organization_name }}
            </router-link>
          </span>

        </template>
      </div>

      <div class="data-row" v-if="data.x_concepts.length">
        <span class="font-weight-bold">
          Concepts:
        </span>
        <span>
          <concepts-list :concepts="data.x_concepts" :is-clickable="true"/>
        </span>
      </div>

      <div class="data-row">
        <span class="font-weight-bold">
          Access:
        </span>
        <span>
          <span v-if="!data.is_oa">
            Paywalled
          </span>
          <span v-else>
            Open Access
            <template v-if="doajLink">(indexed in <a target="_blank" :href="doajLink">DOAJ</a>)</template>
          </span>
        </span>
      </div>
      <div class="data-row" v-if="data.apc_usd > 0 || data.apc_usd === 0">
        <span class="font-weight-bold">
          APC:
        </span>
        <span>
          ${{ data.apc_usd.toLocaleString() }} <span class="caption">(USD)</span>
        </span>
      </div>
    </div>

  </div>


</template>


<script>
import LinkToSearch from "../LinkToSearch.vue";
import LinkToEntity from "../LinkToEntity.vue";
import EntityIcon from "./EntityIcon.vue";
import ConceptsList from "../ConceptsList.vue";
import EntitySummaryStats from "@/components/Entity/EntitySummaryStats.vue";

export default {
  name: "EntityVenue",
  components: {
    LinkToSearch,
    LinkToEntity,
    EntityIcon,
    ConceptsList,
    EntitySummaryStats,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    doajLink() {
      if (!this.data.issn_l) return
      return `https://doaj.org/toc/${this.data.issn_l}`
    }
  },
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss" scoped>
table {
  span.font-weight-bold {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
  }
}

</style>