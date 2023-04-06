<template>
      <tr>
        <td class="table-row-label pt-6 caption">
          IDs:
        </td>
        <td class="pt-6">
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