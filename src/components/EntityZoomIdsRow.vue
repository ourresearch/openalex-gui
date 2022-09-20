<template>
      <tr>
        <td class="table-row-label">
          <v-icon>mdi-tag-outline</v-icon>
          Identifiers:
        </td>
        <td>
<!--          <concepts-list :concepts="parentConcepts" :is-clickable="true"/>-->
          <id-list :data="ids" />
        </td>
      </tr>

</template>


<script>
import IdList from "./IdList";

export default {
  name: "EntityConcept",
  components: {
    IdList,
  },
  props: {
    ids: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
  },
  created() {
  },
  mounted() {


  },
  watch: {}
}
</script>

<style lang="scss">


</style>