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
              v-bind="on"
              class="bar-graph-bar-container"
              @click.prevent="$emit('click', bar.key)"
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
          {{ bar.key }}:
        </span>
          <span class="">
          {{ bar.count | $toPrecision }}
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
    bars: Array, // [{key: "foo": count: 42} ...]
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

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


$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);




.bar-graph {
  flex-direction: row-reverse;
}
.bar-graph-bar-container {
  height: 100%;
  cursor: pointer;
  //background-color: rgba(255, 255, 255, 0.05);
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding-right: 1px;
  &:hover {
    .bar-graph-bar {
      background-color:  rgba(0, 0, 0, 0.5);

    }
  }
}
.bar-graph-bar {
  transition: height 500ms;
  width: 100%;
  //width: calc(100% - 1.1px); // transparent border
  //border-right: 1px solid white;
    background-color:  rgba(0, 0, 0, 0.3);
  //.bar-graph-bar-color {
  //  height: 100%;
  //  width: 100%;
  //
  //}
}
</style>
