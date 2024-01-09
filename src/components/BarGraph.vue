<template>
  <div
        class="d-flex bar-graph"
        style="height: 100%; width: 100%;"
    >
      <v-tooltip
          v-for="(bar, i) in scaledBars"
          :key="i"
          bottom
          transition="none"
      >
        <template v-slot:activator="{on}">
          <div
              v-on="on"
              class="bar-graph-bar-container"
          >
            <!--            @click.exact="clickYear(filter.value)"-->
            <!--            @click.shift="shiftClickYear(filter.value)"-->
            <div
                class="bar-graph-bar caption"
                :style="{height: bar.scaledCount * 100 + '%'}"
            >
              <!--                    :class="{green: isWithinRange(filter.value)}"-->
              <!--              v-ripple-->
            </div>
          </div>
        </template>
        <div>
          <span class="font-weight-bold">
          {{ bar.name }}:
        </span>
          <span class="">
          {{ bar.count | toPrecision }}
        </span>
        </div>

      </v-tooltip>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    bars: Array, // [{name: "foo": count: 42} ...]
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    scaledBars(){
      const maxCount = Math.max(...this.bars.map(f => f.count))
      return  this.bars.map(bar => {
        return {
          ...bar,
          scaledCount: bar.count / maxCount,
        }
      })
    }
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
  watch: {}
}
</script>

<style scoped lang="scss">

.bar-graph {
  flex-direction: row-reverse;
}
.bar-graph-bar-container {
  height: 100%;
  //background-color: rgba(255, 255, 255, 0.05);
  flex: 1;
  display: flex;
  align-items: flex-end;
}
.bar-graph-bar {
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;
  //width: calc(100% - 1px);
  border-right: 1px solid #fff;
}
</style>