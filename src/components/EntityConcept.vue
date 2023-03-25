<template>
  <div>
    <div>
      <div class="data-row" v-if="data.description">
        <span class="font-weight-bold">
          About:
        </span>
        <span class="description">
          {{ data.description }}.
        </span>
      </div>

      <div class="data-row" v-if="parentConcepts.length">
        <span class="font-weight-bold">
          {{"Parent" | pluralize(parentConcepts.length)}}:
        </span>
        <span>
          <concepts-list :concepts="parentConcepts" :is-clickable="true"/>
        </span>
      </div>


      <div class="data-row" v-if="data.related_concepts.length">
        <span class="font-weight-bold">
          Related:
        </span>
        <span>
          <concepts-list :concepts="data.related_concepts" :is-clickable="true"/>
        </span>
      </div>


      <div class="data-row">
        <span class="font-weight-bold pt-6">
          Works
        </span>
        <span class="pt-6">
          <link-to-search
              :count="data.works_count"
              filter-key="concepts.id"
              :filter-value="data.id"
              entity-type="works"
          />
        </span>
      </div>
      <div class="data-row">
        <span class="font-weight-bold">
          Cited by:
        </span>
        <span>
          {{ data.cited_by_count.toLocaleString() }} works
        </span>
      </div>

      <entity-zoom-ids-row :ids="data.ids" />


    </div>


  </div>


</template>


<script>
import IdList from "./IdList";
import EntityIcon from "./EntityIcon";
import ConceptsList from "./ConceptsList";
import LinkToEntity from "./LinkToEntity";
import LinkToSearch from "./LinkToSearch";
import EntityZoomIdsRow from "./EntityZoomIdsRow";

export default {
  name: "EntityConcept",
  components: {
    IdList,
    EntityIcon,
    ConceptsList,
    LinkToEntity,
    LinkToSearch,
    EntityZoomIdsRow,
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
    parentConcepts(){
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