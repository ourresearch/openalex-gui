<template>
  <v-container>
    <div class="">
      💡 <strong>Concept</strong> at level {{ levelChar }}
      <a :href="data.id" class="grey--text d-block body-2">{{ data.id }}</a>
    </div>

    <h1 class="text-h3 mb-4 mt-2">{{ data.display_name }}</h1>
    <div class="description">
      {{data.description}}
      <a :href="data.ids.wikipedia">(Wikipedia)</a>.
    </div>
    <a :href="data.wikidata" class="grey--text body-2 d-block">{{ data.wikidata }}</a>
    <div class="mt-8 pb-12">
      <v-btn class="mr-4" :href="apiUrl" target="_blank">
        View in API
      </v-btn>
    </div>



    <div v-if="data.level > 0">
      <div class="text-h4 mt-12">
        Ancestor concepts ({{data.ancestors.length}})
      </div>
      <link-concept
            v-for="concept in data.ancestors"
            :key="concept.id"
            :data="concept"
        />

    </div>
    <div class="text-h4 mt-12">
      Related concepts ({{data.related_concepts.length}})
    </div>
    <link-concept
          v-for="concept in data.related_concepts"
          :key="concept.id"
          :data="concept"
      />


    <div class="text-h4 mt-12">
      Alternate languages
    </div>
    <ul>
      <li v-for="(val, lang) in data.international.display_name" :key="lang">
        <span class="font-weight-bold">{{lang}}:</span> {{val}}
      </li>
    </ul>

    <div class="text-h4 mt-12">
      Tagged works ({{data.works_count}})
    </div>
    Click to view in API: <a :href="data.works_api_url" target="_blank">{{data.works_api_url}}</a>


  </v-container>


</template>


<script>
import LinkConcept from "./LinkConcept";

export default {
  name: "EntityConcept",
  components: {
    LinkConcept,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    apiUrl() {
      return this.data.id + ".json"
    },
    levelChar(){
      const chars = [
        "⓪",
        "①",
        "②",
        "③",
        "④",
        "⑤",

      ]
      return chars[this.data.level]
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
  .description {
    &:first-letter {
      text-transform: capitalize;
    }
  }


</style>