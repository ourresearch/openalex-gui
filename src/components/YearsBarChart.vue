<template>
  <div class="range-bar-graph">
    <template
          v-for="filter in yearsSorted"
      >
        <div
            class="range-bar-container"
            :key="filter.asStr"
        >
          <div
              v-ripple
              class="range-bar-bar caption"
              :class="{green: isWithinRange(filter.value)}"
              :style="{height: filter.scaledCount * 100 + '%'}"
          >
          </div>
        </div>

      </template>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {sortByKey} from "@/util";
export default {
  name: "YearsBarChart",
  components: {
  },
  props: {
    yearFilters: Array,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    yearsSorted(){
      const ret = _.cloneDeep(this.yearFilters)
      sortByKey(ret, "value")
      return ret
    },
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">


.range-bar-graph {
  flex-direction: row-reverse;
}

.range-bar-container {
  height: 100%;
  //background-color: rgba(255, 255, 255, 0.05);
  flex: 1;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
}

.range-bar-bar {
  //background-color: rgba(255, 255, 255, 0.5);
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;


  &.selected {
    //background-color: rgba(255, 255, 255, 1);
  }
}
</style>