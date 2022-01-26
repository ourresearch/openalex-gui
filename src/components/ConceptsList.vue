<template>
  <div>
<!--        <v-chip-->
<!--            outlined-->
<!--            class="mr-1 mb-1"-->
<!--            v-for="concept in data.x_concepts.slice(0,4)"-->
<!--            :key="concept.id"-->
<!--        >-->
<!--          {{ concept.display_name }}-->
<!--        </v-chip>-->
        <span class="body-1">{{ conceptNamesString }}</span>


  </div>
</template>


<script>

export default {
  components: {},
  props: {
    concepts: Array,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    conceptNamesString(){
      return this.concepts.slice(0, 4).map(c => c.display_name).join(", ")
    }
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