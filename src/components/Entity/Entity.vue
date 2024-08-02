<template>
  <div>
    <div
        v-for="(property, i) in properties"
        :key="i"
    >
      <span class="font-weight-bold">
        <template v-if="property.config.id === 'id'"><!-- hack for OpenAlex ID -->
          OpenAlex ID
        </template>
        <template v-else>
          {{ property.config.displayName }}:
        </template>
      </span>
      <prop-value :property="property" />
    </div>
    <div class="pt-3 d-flex">
      <v-spacer />
      <v-btn icon :to="id">
        <v-icon>mdi-link</v-icon>
      </v-btn>
      <v-btn icon :href="`https://api.openalex.org/${id}`" target="_blank">
        <v-icon>mdi-api</v-icon>
      </v-btn>
    </div>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {entity} from "@/entity";
import PropValue from "@/components/PropValue.vue";

export default {
  name: "Template",
  components: {
    PropValue,
  },
  props: {
    id: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      properties: [],
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    entityType() {
      return entity.getType(this.id, this.$root.config)
    },
    entityId() {
      return entity.getId(this.id, this.$root.config)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    async getData() {
      this.isLoading = true
      try {
        this.properties = await entity.getEntityData(this.id)
      } catch (e) {
        console.error(e)
        this.snackbar({msg: "Error fetching entity data", color: "error"})
      } finally {
        this.isLoading = false
      }
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