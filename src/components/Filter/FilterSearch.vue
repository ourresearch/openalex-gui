<template>
  <filter-base :filter-key="filterKey" :index="index">
      <v-chip
          variant="text"
          class="option mr-1 px-4 py-4 mb-1 mt-1 font-weight-regular hover-color-1 text-body-1"
          @click="isActive = true"
          v-if="!isActive"
      >
        "{{ value }}"
        <v-icon end size="small">mdi-pencil</v-icon>
      </v-chip>
      <template v-if="isActive">
        <v-text-field
            v-model="searchString"
            class="rounded-lg"
            density="compact"
            variant="solo-filled"
            flat
            hide-details
            autofocus
            placeholder="Enter search terms"
            :append-icon="searchString && searchString !== value ? 'mdi-check-bold' : undefined"
            @keydown.enter="submit"
            @click:append="submit"
            @blur="cancel"
            @keydown.esc="cancel"
        />
      </template>
  </filter-base>
</template>

<script>

import {mapGetters} from "vuex";
import {url} from "@/url";
import {getFacetConfig} from "../../facetConfigs";
import FilterBase from "@/components/Filter/FilterBase.vue";


export default {
  name: "FilterValueSearch",
  components: {
    FilterBase,
  },
  props: {
    filterKey: String,
    index: Number,
  },
  data() {
    return {
      foo: 42,
      isActive: false,
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    value: {
      get() {
        return url.readFilterValue(this.$route, this.$store.state.entityType, this.index)
      },
      set(to) {
        console.log("FilterSearch value set()", to)
        this.value ?
            url.updateOrDeleteFilter(this.entityType, this.index, to) :
            url.createFilter(this.entityType, this.filterKey, to)
      }
    }
  },
  methods: {
    submit() {
      this.isActive = false
      this.value = this.searchString
    },
    cancel(){
      this.isActive = false
      this.searchString = this.value
    }
  },
  mounted() {
    this.searchString = this.value
    this.isActive = !this.value
  },
}
</script>


<style scoped lang="scss">
input {
  padding: 0 3px !important;
}
</style>