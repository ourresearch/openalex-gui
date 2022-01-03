<template>
  <v-container>
    <div class="">
      💡 <strong>Concept</strong>
<!--      <a :href="data.id" class="grey&#45;&#45;text d-block body-2">{{ data.id }}</a>-->
    </div>

    <h1 class="text-h3">{{ data.display_name }}</h1>
    <div class="description text-h5">
      {{data.description}}.
      <a :href="data.ids.wikipedia">(Wikipedia)</a>
    </div>
    <div>{{ levelChar }} level</div>
    <div class="mt-8 pb-12">
      <v-btn class="mr-4" :href="apiUrl" target="_blank">
        View in API
      </v-btn>
    </div>

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids" />


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
import IdList from "./IdList";

export default {
  name: "EntityConcept",
  components: {
    LinkConcept,
    IdList,
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
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/concepts/${shortId}`
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