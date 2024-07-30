<template>
  <div>
    <div>id: {{ id }}</div>
    <div>{{ data }}</div>
    <div
      v-for="(property, i) in data"
      :key="i"
    >

    </div>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {entity} from "@/entity";

export default {
  name: "Template",
  components: {},
  props: {
    id: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      data: {},
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    entityType(){
      return entity.getType(this.id, this.$root.config)
    },
    entityId(){
      return entity.getId(this.id, this.$root.config)
    },
    properties(){
      return this.data
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    async getData() {
      this.isLoading = true
      const resp = await entity.getEntityData(this.id, this.$root.config)
      this.data = resp.data
      this.isLoading = false
    }
  },
  watch: {
    id: {
      handler: function (newVal, oldVal) {
        this.getData()
      },
      immediate: true
    }
  }
}
</script>

<style scoped lang="scss">

</style>