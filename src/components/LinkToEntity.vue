<template>
  <span v-if="entity">
<!--        style="display: inline-block; white-space: nowrap;"-->
    <router-link
        :to="entity.id | entityZoomLink"
        class="text-decoration-none"
        v-if="entity.id"
    >{{ entity.display_name }}</router-link>
    <span
        style="display: inline-block; white-space: nowrap;"
        class=""
        v-else
    >{{ entity.display_name }}</span>

  </span>
</template>


<script>
import {createSimpleFilter} from "../filterConfigs";

export default {
  components: {},
  props: {
    entity: Object,
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