<template>
  <div>
    <router-link class="text-decoration-none subtitle-1" :to="data.id | idLink">
      {{ data.display_name }}
    </router-link>
    <div v-if="authorsCount" class="body-1">
      <span>{{ authorNames[0] }}</span>
      <span v-if="authorNames.length > 1">, {{ authorNames[1] }}</span>
      <span v-if="authorNames.length > 2">, et al.</span>


      <!--      <span class="font-italic" v-if="authorNames.length > 3">, ...</span>-->
      <!--      <span v-if="authorNames.length > 2">, {{ authorNames[lastAuthorIndex] }}</span>-->
      <span v-if="data.host_venue.display_name" class="font-italic"> - {{
          data.host_venue.display_name | truncate(50)
        }}</span>
      <span v-if="data.publication_year"><span v-if="data.host_venue.display_name">,</span> {{ data.publication_year }} </span>

    </div>
    <div>
    </div>
    <concepts-list class="d-none" :concepts="data.concepts"/>

    <div class="body-1">
      <span>
        <v-icon small color="primary">mdi-format-quote-close</v-icon>
        <router-link
            :to="linkToCitingPapers"
            class="text-decoration-none"
        >
          {{ data.cited_by_count.toLocaleString() }}
        </router-link>
      </span>





      <a
          :href="fulltextUrl"
          target="_blank"
          class="mx-3 text-decoration-none"
          v-if="fulltextUrl"
      >
        <v-icon small color="primary" style="vertical-align: 0;">mdi-open-in-new</v-icon>
        Fulltext {{ (workIsFreeAtPublisher) ? "via publisher" : "online" }}
      </a>
    </div>
  </div>
</template>


<script>
import ConceptsList from "./ConceptsList";

export default {
  components: {
    ConceptsList,
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
    oaUrlHostname() {
      if (!this.data.open_access?.oa_url) return
      const url = new URL(this.data.open_access.oa_url)
      return url.hostname
    },
    workIsFreeAtPublisher() {
      return ["gold", "bronze", "hybrid"].includes(this.data.open_access.oa_status)
    },
    linkToCitingPapers(){
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return {
        // name: "Serp",
        path: "/works",
        // params: {entityType: "works"},
        query: {filter: `referenced_works:${shortId}`}
      }
    },
    fulltextUrl() {
      // this is kind of hacky because the oa data we get back from the api has weird holes.
      if (this.data.open_access.oa_url) return this.data.open_access.oa_url
      else if (this.data.open_access.is_oa) return this.data.host_venue.url
      else return null
    },
    authorsList() {
      return this.data.authorships.map(a => {
        return a.author.display_name
      }).join(", ")
    },
    authorNames() {
      return this.data.authorships.map(a => a.author.display_name)
    },
    authorsCount() {
      return this.data.authorships.length
    },
    hiddenAuthors() {
      if (this.authorsCount < 4) return []
      return this.authorNames.slice(2, this.lastAuthorIndex)

    },
    lastAuthorIndex() {
      return this.authorNames.length - 1
    },
    lastAuthorName() {
      if (this.authorsCount <= 1) return
      return this.data.authorships[this.data.authorships.length - 1].author.display_name
    },
    firstAuthorName() {
      if (!this.authorsCount) return
      if (this.authorsCount <= 2) return [this.data.authorships[0].author.display_name]
    },
    middleAuthorsToHide() {

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