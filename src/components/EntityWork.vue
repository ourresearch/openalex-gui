<template>
  <v-container style="overflow: initial;">

    <div class="body-2">
      📄 Work<span v-if="data.type">: {{ data.type.replace("-", " ") }}</span>
    </div>

    <div class="text-h6">{{ data.title }}</div>

    <div class="">
      <a class="font-italic" v-if="data.host_venue.display_name"
         :href="data.host_venue.id | idLink">{{ data.host_venue.display_name }}</a>
      <span class="year ml-2" v-if="data.publication_year">
        ({{ data.publication_year }})
      </span>
    </div>
    <div>
      <concepts-list :concepts="data.concepts" :is-clickable="true"/>
    </div>


    <div class="mt-4">
      <template v-if="authorshipsToShow.length === 1">
        <authorship
            :key="authorshipsToShow[0].author.id"
            :authorship="authorshipsToShow[0]"
            :show-institutions="true"
        />
      </template>
      <template v-else>
        <authorship
            v-for="(authorship, i) in authorshipsToShow"
            :key="authorship.author.id"
            :authorship="authorship"
            :append-comma="i < authorshipsToShow.length - 1"
            :show-institutions="showAuthorDetails"
        />
        <v-btn
            small
            text
            color="primary"
            @click="showAuthorDetails = !showAuthorDetails"
        >
          <template v-if="showAuthorDetails">show less</template>
          <template v-else>
            <template v-if="truncatedAuthorshipsCount">+{{ truncatedAuthorshipsCount }} more</template>
            <template v-if="!truncatedAuthorshipsCount && authorshipsHaveAtLeastOneInstitution">show details</template>
          </template>

        </v-btn>
      </template>
    </div>

    <div class="mt-8">
      <!--      <view-in-api-button :id="data.id" />-->

      <v-btn
          :href="fulltextUrl"
          target="_blank"
          class="mr-3"
          v-if="fulltextUrl"
          color="primary"
          small
      >
        <v-icon left>mdi-open-in-new</v-icon>
        Fulltext {{ (workIsFreeAtPublisher) ? "via publisher" : "online" }}
      </v-btn>

      <v-btn
          :href="data.host_venue.url"
          target="_blank"
          class="mr-3"
          v-if="data.host_venue.url && !workIsFreeAtPublisher"
          small
      >
        <v-icon left>mdi-open-in-new</v-icon>
        Paywalled at publisher
      </v-btn>
      <div class="mt-3">
        <v-btn
            :href="apiUrl + '.bib'"
            class=" text-initial"
            small
            text
        >
          <v-icon small left>mdi-download-outline</v-icon>
          BibTeX
        </v-btn>
        <v-btn
            :href="apiUrl"
            target="_blank"
            class=" text-initial"
            small
            text
        >
          <v-icon small left>mdi-cog-outline</v-icon>
          API
        </v-btn>
        <v-btn
            @click="copyPermalinkToClipboard"
            class=" text-initial"
            small
            text
        >
          <v-icon small left>mdi-content-copy</v-icon>
          Permalink
        </v-btn>
      </div>
    </div>


    <v-divider class="mt-12 pt-12"/>

    <div class="text-h4">Identifiers</div>
    <id-list :data="data.ids"/>

  </v-container>


</template>


<script>
import ConceptsList from "./ConceptsList";
import IdList from "./IdList";
import Authorship from "./Authorship";

import {mapActions, mapMutations, mapGetters} from "vuex";

export default {
  name: "EntityWork",
  components: {
    ConceptsList,
    IdList,
    Authorship,

  },
  props: {
    data: Object,
  },
  data() {
    return {
      showAuthorDetails: false,
      maxAuthorshipsToShowAtFirst: 10,
    }
  },
  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),
    async copyPermalinkToClipboard() {
      await navigator.clipboard.writeText(this.data.id);
      this.snackbar("Permalink copied to clipboard.")
      // alert('Copied!');
    }
  },
  computed: {
    ...mapGetters([]),
    workIsFreeAtPublisher() {
      return ["gold", "bronze", "hybrid"].includes(this.data.open_access.oa_status)
    },
    fulltextUrl() {
      // this is kind of hacky because the oa data we get back from the api has weird holes.
      if (this.data.open_access.oa_url) return this.data.open_access.oa_url
      else if (this.data.open_access.is_oa) return this.data.host_venue.url
      else return null
    },
    apiUrl() {
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/works/${shortId}`
    },
    authorshipsCount() {
      return this.data.authorships.length
    },

    authorshipsHaveAtLeastOneInstitution() {
      return this.data.authorships.some(a => {
        return a.institutions.length
      })
    },

    truncatedAuthorshipsCount() {
      return Math.max(this.data.authorships.length - this.maxAuthorshipsToShowAtFirst, 0)
    },
    authorshipsToShow() {
      if (!this.authorshipsCount) return []
      const sliceAt = (this.showAuthorDetails) ? Infinity : this.maxAuthorshipsToShowAtFirst
      return this.data.authorships.slice(0, sliceAt)
    },
  },
  created() {
  },
  mounted() {

  },
  watch: {
    "data.id": function(to, from){
      console.log("EntityWork new ID", to)
      this.showAuthorDetails = false
    }
  }
}
</script>

<style lang="scss">


</style>