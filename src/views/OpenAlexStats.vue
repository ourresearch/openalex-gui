<template>
  <v-container class="page">
    <h3 class="text-h3">OpenAlex Stats</h3>
    <v-card class="mx-auto" max-width="800px">
      <v-progress-circular indeterminate v-if="loading" />
      <v-expansion-panels v-else>
        <v-expansion-panel v-for="(item, i) in items" :key="i">
          <v-expansion-panel-title :hide-actions="!item.children"
            @click="item.onClick && !item.clicked ? item.onClick() : null">
            <v-chip label variant="outlined" size="large" class="text-button">
              <v-icon size="large">{{ item.icon }}</v-icon>
              <div class="px-6">
                {{ item.value.toLocaleString() }} {{ item.text }}
              </div>
            </v-chip>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-list>
              <v-list-item v-for="(child, j) in item.children" :key="j">
                <v-chip label variant="outlined" size="large" class="text-button">
                  <v-icon size="large">{{ child.icon }}</v-icon>
                  <div v-if="child.value" class="px-6">
                    {{ child.value.toLocaleString() }} {{ child.text }}
                  </div>
                  <v-progress-circular indeterminate v-else />
                </v-chip>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>

        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>

  </v-container>
</template>

<script>
import axios from 'axios'
import { useHead } from '@unhead/vue';

export default {
  name: "OpenAlexStats",
  created() {
    useHead({ title: 'OpenAlex Stats' });
  },
  data() {
    return {
      numWorks: null,
      numAuthors: null,
      numInstitutions: null,
      numSources: null,
      numPublishers: null,
      numFunders: null,

      numWorksOpenAccess: null,
      numWorksArticles: null,
      numWorksBookChapters: null,
      numWorksDissertations: null,
      numWorksBook: null,
      numWorksDataset: null,
      numWorksGlobalSouth: null,

      numAuthorsHasOrcid: null,
      numAuthorsGlobalSouth: null,

      numSourcesOpenAccess: null,

      loading: true,
      numUpdates: 0,
      numApiCalls: 0
    }
  },
  methods: {
    async asyncLoadStats() {
      try {
        let url = "https://api.openalex.org/counts?bypass_cache=true"
        let res = await axios.get(url)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
        const counts = res.data
        this.numWorks = new Number(counts.works)
        this.numAuthors = new Number(counts.authors)
        this.numInstitutions = new Number(counts.institutions)
        this.numSources = new Number(counts.sources)
        this.numPublishers = new Number(counts.publishers)
        this.numFunders = new Number(counts.funders)
        this.numUpdates++
        this.loading = false
      } catch (e) {
        // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
        console.log("api GET failure:", e.response)
        throw e
      }
      setTimeout(this.asyncLoadStats, 30000)
    },
    async asyncLoadWorksStats() {
      try {
        let url = "https://api.openalex.org/works?group_by=type&bypass_cache=true"
        let res = await axios.get(url)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
        res.data.group_by.map((item) => {
          if (item.key === 'article') {
            this.numWorksArticles = new Number(item.count)
          } else if (item.key === 'book-chapter') {
            this.numWorksBookChapters = new Number(item.count)
          } else if (item.key === 'dissertation') {
            this.numWorksDissertations = new Number(item.count)
          } else if (item.key === 'book') {
            this.numWorksBook = new Number(item.count)
          } else if (item.key === 'dataset') {
            this.numWorksDataset = new Number(item.count)
          }
        })
        url = "https://api.openalex.org/works?filter=open_access.is_oa:true&bypass_cache=true"
        res = await axios.get(url)
        this.numWorksOpenAccess = new Number(res.data.meta.count)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
        url = "https://api.openalex.org/works?filter=institutions.is_global_south:true&bypass_cache=true"
        res = await axios.get(url)
        this.numWorksGlobalSouth = new Number(res.data.meta.count)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
      } catch (e) {
        // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
        console.log("api GET failure:", e.response)
        throw e
      }
      setTimeout(this.asyncLoadWorksStats, 30000)
    },

    async asyncLoadAuthorsStats() {
      try {
        let url = "https://api.openalex.org/authors?filter=has_orcid:true&bypass_cache=true"
        let res = await axios.get(url)
        this.numAuthorsHasOrcid = new Number(res.data.meta.count)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
        url = "https://api.openalex.org/authors?filter=last_known_institution.is_global_south:true&bypass_cache=true"
        res = await axios.get(url)
        this.numAuthorsGlobalSouth = new Number(res.data.meta.count)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
      } catch (e) {
        // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
        console.log("api GET failure:", e.response)
        throw e
      }
      setTimeout(this.asyncLoadAuthorsStats, 30000)
    },

    async asyncLoadSourcesStats() {
      try {
        let url = "https://api.openalex.org/sources?filter=is_oa:true&bypass_cache=true"
        let res = await axios.get(url)
        this.numSourcesOpenAccess = new Number(res.data.meta.count)
        this.numApiCalls++
        console.log(`api GET ${url} success (${this.numApiCalls} API calls):`, res.data)
      } catch (e) {
        // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
        console.log("api GET failure:", e.response)
        throw e
      }
      setTimeout(this.asyncLoadSourcesStats, 30000)
    }

  },
  computed: {

    items() {
      return [
        {
          text: 'Works',
          icon: 'mdi-file-document-outline',
          value: this.numWorks,
          onClick: this.asyncLoadWorksStats,
          clicked: false,
          children: [
            {
              text: 'Open Access Works',
              icon: 'mdi-lock-open-outline',
              value: this.numWorksOpenAccess
            },
            {
              text: 'Articles',
              icon: 'mdi-file-document-outline',
              value: this.numWorksArticles
            },
            {
              text: 'Book Chapters',
              icon: 'mdi-book-open-page-variant-outline',
              value: this.numWorksBookChapters
            },
            {
              text: 'Dissertations',
              icon: 'mdi-account-school',
              value: this.numWorksDissertations
            },
            {
              text: 'Books',
              icon: 'mdi-book-open-outline',
              value: this.numWorksBook
            },
            {
              text: 'Datasets',
              icon: 'mdi-database-outline',
              value: this.numWorksDataset
            },
            {
              text: 'Works in the Global South',
              icon: 'mdi-map-marker-outline',
              value: this.numWorksGlobalSouth
            },
          ]
        },
        {
          text: 'Authors',
          icon: 'mdi-account-outline',
          value: this.numAuthors,
          onClick: this.asyncLoadAuthorsStats,
          clicked: false,
          children: [
            {
              text: 'Authors with ORCID',
              icon: 'mdi-tag-outline',
              value: this.numAuthorsHasOrcid
            },
            {
              text: 'Authors in the Global South',
              icon: 'mdi-map-marker-outline',
              value: this.numAuthorsGlobalSouth
            }
          ]
        },
        {
          text: 'Institutions',
          icon: 'mdi-town-hall',
          value: this.numInstitutions
        },
        {
          text: 'Sources',
          icon: 'mdi-book-multiple-outline',
          value: this.numSources,
          clicked: false,
          onClick: this.asyncLoadSourcesStats,
          children: [
            {
              text: 'Open Access Sources',
              icon: 'mdi-lock-open-outline',
              value: this.numSourcesOpenAccess
            }
          ]
        },
        {
          text: 'Publishers',
          icon: 'mdi-domain',
          value: this.numPublishers
        },
        {
          text: 'Funders',
          icon: 'mdi-cash-multiple',
          value: this.numFunders
        },
      ]

    }
  },
  async mounted() {
    this.asyncLoadStats()

  }
}
</script>

<style scoped lang="scss"></style>