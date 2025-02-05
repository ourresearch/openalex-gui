<template>
  <div>
    <div class="d-flex">
      <div class="text-h5">
        {{ displayName || "Untitled" }}
      </div>
      <v-spacer/>
      <v-btn v-if="closeable" icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <div class="grey--text caption" style="font-family: monospace !important;">
      {{ openAlexId }}
    </div>
    <div class="d-flex">
      <v-btn icon :small="smallButtons" :to="'/'+id">
        <v-icon :small="smallButtons">mdi-link</v-icon>
      </v-btn>
      <v-btn icon :small="smallButtons" :href="`https://api.openalex.org/${id}`" target="_blank">
        <v-icon :small="smallButtons">mdi-api</v-icon>
      </v-btn>

    </div>
    <v-divider class="my-2"/>
    <div
        v-for="(property, i) in rowsToShow"
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
      <prop-value :property="property"/>
    </div>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {entity} from "@/entity";
import PropValue from "@/components/ColumnValue.vue";
import {isDisplayable} from "@/util";

export default {
  name: "Entity",
  components: {
    PropValue,
  },
  props: {
    id: String,
    smallButtons: Boolean,
    closeable: Boolean,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      properties: [],
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
    displayName() {
      return this.properties.find(p => p.config.id === "display_name")?.value
    },
    openAlexId() {
      return this.properties.find(p => p.config.id === "id")?.value
    },
    rowsToShow() {
      return this.properties.filter(p => {
        if (!p.config) return false
        if (p.config.id === "display_name") return false
        if (p.config.id === 'id') return false
        if (!isDisplayable(p.value)) return false
        return true
      })

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
      try {
        console.log("getting properties", this.id)
        this.properties = await entity.getEntityData(this.id)
        console.log("got properties", this.properties)
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