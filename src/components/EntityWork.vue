<template>
  <v-container>
    <div class="caption">{{ data.type }}</div>
    <h1 class="text-h3">{{ data.title }}</h1>

    <div class="mb-4">
      {{ data.publication_year }}
      <a :href="data.host_venue.id">
        {{ data.host_venue.display_name }}
      </a>
    </div>

    <div>
      <div
          v-for="authorship in data.authorships"
          :key="authorship.author.id"
          class="authorship"
      >
        <author-link :data="authorship.author" class="body-1" />
        <span class="ml-2 institutions-list body-2">
          (<template v-for="(institution, i) in authorship.institutions">
              <template v-if="i > 0">, </template><institution-link
                  :key="institution.id"
                  :data="institution"
              />
            </template>)

        </span>

      </div>
    </div>
    <pre>
      {{ data }}
    </pre>

  </v-container>


</template>


<script>
import AuthorLink from "./AuthorLink";
import InstitutionLink from "./InstitutionLink";

export default {
  name: "EntityWork",
  components: {AuthorLink, InstitutionLink},
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