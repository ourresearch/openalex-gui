<template>
  <div class="pa-3">
    <entity-body :data="data" />
  </div>


</template>


<script>
import IdList from "../IdList.vue";
import EntityIcon from "./EntityIcon.vue";
import ConceptsList from "../ConceptsList.vue";
import LinkToEntity from "../LinkToEntity.vue";
import LinkToSearch from "../LinkToSearch.vue";
import EntitySummaryStats from "@/components/Entity/EntitySummaryStats.vue";
import EntityBody from "@/components/Entity/EntityBody.vue";

export default {
  name: "EntityConcept",
  components: {
    EntityBody,
    IdList,
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
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
    levelChar() {
      const chars = [
        "⓪",
        "①",
        "②",
        "③",
        "④",
        "⑤",
      ]
      return chars[this.data.level]
    },
    parentConcepts() {
      if (!this.data.ancestors.length) return []
      return this.data.ancestors.filter(c => {
        return c.level === this.data.level - 1
      })
    },
  },
  created() {
  },
  mounted() {


  },
  watch: {}
}
</script>

<style lang="scss">
.description {
  &:first-letter {
    text-transform: capitalize;
  }
}

table {
  span.font-weight-bold {
    white-space: nowrap;
    vertical-align: top;
    color: #555;
    font-size: 15px;
    padding-right: 5px;
  }

  span {
    vertical-align: top;
  }
}


</style>