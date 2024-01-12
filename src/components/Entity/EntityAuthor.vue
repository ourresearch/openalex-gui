<template>
    <div class="pa-3">




      <entity-body :data="data" />
    </div>
</template>


<script>
import EntityIcon from "./EntityIcon.vue";
import ConceptsList from "../ConceptsList.vue";
import LinkToEntity from "../LinkToEntity.vue";
import LinkToSearch from "../LinkToSearch.vue";
import EntitySummaryStats from "@/components/Entity/EntitySummaryStats.vue";
import EntityBody from "@/components/Entity/EntityBody.vue";


export default {
  name: "EntityAuthor",
  components: {
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
    EntitySummaryStats,
    EntityBody,
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
  computed: {},
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss" scoped>


</style>