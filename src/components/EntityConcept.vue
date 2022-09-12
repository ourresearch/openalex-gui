<template>
  <div>
    <div class="description text-h5">
      {{data.description}}.
      <a :href="data.ids.wikipedia">(Wikipedia)</a>
    </div>
    <div>{{ levelChar }} level</div>
    <div class="mt-8">
      <view-in-api-button :id="data.id" />
    </div>
    <v-divider class="mt-12 pt-12" />

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids" />


    <div v-if="data.level > 0">
      <div class="text-h4 mt-12">
        {{data.ancestors.length.toLocaleString()}} ancestor concepts
      </div>
      <link-concept
            v-for="concept in data.ancestors"
            :key="concept.id"
            :data="concept"
        />

    </div>
    <div class="text-h4 mt-12">
      {{data.related_concepts.length.toLocaleString()}} related concepts
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
      {{data.works_count.toLocaleString()}} tagged works
    </div>
    Click to view in API: <a :href="data.works_api_url" target="_blank">{{data.works_api_url}}</a>


  </div>


</template>


<script>
import LinkConcept from "./LinkConcept";
import IdList from "./IdList";
import ViewInApiButton from "./ViewInApiButton";

export default {
  name: "EntityConcept",
  components: {
    LinkConcept,
    IdList,
    ViewInApiButton,
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