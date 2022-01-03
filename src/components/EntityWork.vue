<template>
  <v-container>
    <div class="body-1">
      Work<template v-if="data.type"> ({{ data.type }})</template>:
      <span>{{data.id}}</span>
    </div>
    <h1 class="text-h3">{{ data.title }}</h1>

    <div class="mb-4">
      {{ data.publication_year }}
      <a :href="data.host_venue.id">
        {{ data.host_venue.display_name }}
      </a>
    </div>

    <div class="my-4">
      <link-concept
          v-for="concept in data.concepts"
          :key="concept.id"
          :data="concept"
      />
    </div>

    <div>
      <div
          v-for="authorship in data.authorships"
          :key="authorship.author.id"
          class="authorship"
      >
        <link-author :data="authorship.author" class="body-1" />
        <span class="ml-2 institutions-list body-2">
          (<template v-for="(institution, i) in authorship.institutions">
              <template v-if="i > 0">, </template><link-institution
                  :key="institution.id"
                  :data="institution"
              />
            </template>)

        </span>

      </div>
    </div>

  </v-container>


</template>


<script>
import LinkAuthor from "./LinkAuthor";
import LinkInstitution from "./LinkInstitution";
import LinkConcept from "./LinkConcept";

export default {
  name: "EntityWork",
  components: {
    LinkAuthor,
    LinkInstitution,
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
  computed: {},
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss">


</style>