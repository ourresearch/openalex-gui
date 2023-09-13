<template>
  <v-list-item class="content " :to="clickRoute">
<!--    <v-list-item-icon>-->
<!--      <v-icon>mdi-file-document-outline</v-icon>-->
<!--    </v-list-item-icon>-->
    <v-list-item-content class="">
      <v-list-item-title class="primary--text">

        <span v-html="$prettyTitle(data.title)"></span>


      </v-list-item-title>

      <v-list-item-subtitle class="">

        <div v-if="authorsCount" class="">
          <span>{{ authorNames[0] }}</span>
          <span v-if="authorNames.length > 1">, {{ authorNames[1] }}</span>
          <span v-if="authorNames.length > 2">, et al.</span>


          <!--      <span class="font-italic" v-if="authorNames.length > 3">, ...</span>-->
          <!--      <span v-if="authorNames.length > 2">, {{ authorNames[lastAuthorIndex] }}</span>-->
          <span
              v-if="data.primary_location && data.primary_location.source && data.primary_location.source.display_name"
              class="font-italic"> - {{
              data.primary_location.source.display_name | truncate(50)
            }}</span>
          <span v-if="data.publication_year"><span
              v-if="data.primary_location && data.primary_location.source && data.primary_location.source.display_name">,</span> {{
              data.publication_year
            }} </span>

        </div>
      </v-list-item-subtitle>

      <v-list-item-subtitle class="">

        <div class="">
          <v-chip v-if="data.is_retracted" class="mr-2" x-small color="error">retracted</v-chip>

          <result-citation-count
              :id="data.id"
              :cited-by-count="data.cited_by_count"
              entity-type="works"
              class="mr-3"
          />
          <!--          <a-->
          <!--                  v-if="fulltextLinkObj"-->
          <!--                  :href="fulltextLinkObj.href"-->
          <!--                  target="_blank"-->
          <!--                  class="text-decoration-none mr-3 body-1"-->
          <!--          >-->
          <!--            <v-icon color="primary" small >-->
          <!--              {{ fulltextLinkObj.icon }}-->
          <!--            </v-icon>-->
          <!--            {{ fulltextLinkObj.text }}-->
          <!--          </a>-->

        </div>

      </v-list-item-subtitle>


    </v-list-item-content>
    <v-list-item-action >
      <v-btn
          v-if="fulltextLinkObj"
          icon
          :href="fulltextLinkObj.href"
          color="primary"
          target="_blank"
          @click.stop="$emit('click')"
      >
                  <v-icon color="primary">
                    {{ fulltextLinkObj.icon }}
                  </v-icon>
<!--        {{ fulltextLinkObj.text }}-->
<!--        <v-icon small right>mdi-open-in-new</v-icon>-->
      </v-btn>

    </v-list-item-action>

    <!--    <div style="width: 35px;" class="align-self-start mt-1 mr-1">-->
    <!--    </div>-->

  </v-list-item>

</template>


<script>
import ConceptsList from "../ConceptsList.vue";
import ResultCitationCount from "./ResultCitationCount.vue";
import {unravel} from "../../util";
import {createSimpleFilter, filtersAsUrlStr} from "../../filterConfigs";
import {mapGetters} from "vuex";


export default {
  components: {
    ConceptsList,
    ResultCitationCount,
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
    ...mapGetters([
      "resultsFilters",
    ]),
    oaUrlHostname() {
      if (!this.data.open_access?.oa_url) return
      const url = new URL(this.data.open_access.oa_url)
      return url.hostname
    },
    clickRoute() {
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return {
        name: "EntityPage",
        params: {entityType: "works", entityId: shortId},
      }
    },
    workIsFreeAtPublisher() {
      return ["gold", "bronze", "hybrid"].includes(this.data.open_access.oa_status)
    },
    linkToRelatedWorks() {
      if (!this.data.related_works.length) return
      const shortId = this.data.id.replace("https://openalex.org/", "")
      return {
        name: "Serp",
        params: {entityType: "works"},
        query: {filter: `related_to:${shortId}`}
      }
    },
    isOpenlyLicensed() {
      return ["gold", "bronze"].includes(this.data.open_access.oa_status)
    },
    abstract() {
      if (!this.data.abstract_inverted_index) return
      return unravel(this.data.abstract_inverted_index)
    },
    fulltextUrl() {
      // this is kind of hacky because the oa data we get back from the api has weird holes.
      if (this.data.open_access.oa_url) return this.data.open_access.oa_url
      else if (this.data.open_access.is_oa) return this.data.primary_location.source.url
      else return null
    },
    fulltextLinkObj() {
      if (!this.data.best_oa_location) return
      if (this.data.best_oa_location.pdf_url) {
        return {
          icon: "mdi-file-pdf-box",
          // icon: "mdi-lock-open-variant",
          text: "PDF",
          href: this.data.best_oa_location.pdf_url
        }
      } else {
        return {
          icon: "mdi-file-document",
          // icon: "mdi-lock-open-variant",
          text: "HTML",
          href: this.data.best_oa_location.landing_page_url
        }
      }
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