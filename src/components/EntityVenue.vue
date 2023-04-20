<template>
    <div class="pa-3">
      <div class="data-row" v-if="data.host_organization_name">
        <span class="font-weight-bold">
          Publisher:
        </span>
        <span>
          <router-link
              :to="data.host_organization | entityZoomLink"
              class="text-decoration-none"
          >
            {{ data.host_organization_name }}
          </router-link>
        </span>
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
          ${{data.apc_usd.toLocaleString()}} <span class="caption">(USD)</span>
        </span>
      </div>
    </div>




</template>


<script>
import LinkToSearch from "./LinkToSearch";
import LinkToEntity from "./LinkToEntity";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import EntitySummaryStats from "@/components/EntitySummaryStats.vue";

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