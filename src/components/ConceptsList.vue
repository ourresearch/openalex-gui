<template>
  <div>
    <template v-if="isClickable">
      <div class="">
        <span class="font-weight-bold">
        {{ concepts.length }}
      Concept{{ (concepts.length > 1) ? 's' : '' }}

        </span>
        <a
            v-if="hiddenConceptsCount"
            @click="showAll = !showAll">
          <template v-if="!showAll">(show all)</template>
          <template v-else>(show less)</template>
        </a>
      </div>
      <link-concept
          v-for="(concept, i) in conceptsToShow"
          :key="concept.id"
          :data="concept"
          :append-comma="i < conceptsToShow.length - 1"
          class="mr-1"
      />
    </template>
    <template v-else>
      <span class="body-1">{{ conceptNamesString }}</span>

    </template>


  </div>
</template>


<script>
import LinkConcept from "./LinkConcept";

export default {
  components: {
    LinkConcept,
  },
  props: {
    concepts: Array,
    isClickable: Boolean,
    maxToShow: {
      type: Number,
      default: 3,
    },
  },
  data() {
    return {
      showAll: false,
    }
  },
  methods: {},
  computed: {
    conceptNamesString() {
      return this.concepts.slice(0, this.maxToShow).map(c => c.display_name).join(", ")
    },
    conceptsToShow() {
      const max = (this.showAll) ? Infinity : this.maxToShow
      return this.concepts.slice(0, max)
    },
    hiddenConceptsCount() {
      return Math.max(this.concepts.length - this.maxToShow, 0)
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {
    "concepts": function (to, from) {
      // this.showAll = false
    }
  }
}
</script>

<style lang="scss">


</style>