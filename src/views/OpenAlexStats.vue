<template>
  <v-container class="page">
    <h3 class="text-h3">OpenAlex Stats</h3>
    <v-card class="mx-auto" max-width="800px">
      <v-progress-circular indeterminate v-if="loading" />
      <v-list v-else>
        <v-list-group v-for="(item, i) in items" :key="i" v-model="item.active" no-action append-icon="">
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>
                <v-chip label outlined large>
                  <v-icon>{{ item.icon }}</v-icon>
                  <div class="px-4">
                    {{ item.value.toLocaleString() }} {{ item.text }}
                  </div>
                </v-chip>
              </v-list-item-title>
            </v-list-item-content>

          </template>
        </v-list-group>
      </v-list>
    </v-card>

    <v-card class="mx-auto" max-width="800px">
      <v-progress-circular indeterminate v-if="loading" />
      <v-list v-else>
        <v-list-group v-for="(item, i) in items" :key="i" v-model="item.active" no-action append-icon="">
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>
                <v-chip label outlined large>
                  <v-icon>{{ item.icon }}</v-icon>
                  <div class="px-4">
                    {{ item.value.toLocaleString() }} {{ item.text }}
                  </div>
                </v-chip>
              </v-list-item-title>
            </v-list-item-content>

          </template>
        </v-list-group>
      </v-list>
    </v-card>

  </v-container>
</template>

<script>
import { api } from "@/api";
import axios from 'axios'
export default {
  name: "OpenAlexStats",
  metaInfo: { title: "OpenAlex Stats" },
  data() {
    return {
      works: {
        count: null,
        text: 'Works',
        icon: 'mdi-file-document-outline',
        children: {
          openAccess: null
        },
      },
      authors: null,
      institutions: null,
      sources: null,
      publishers: null,
      funders: null,
      worksOpenAccess: null,
      loading: true,
      numUpdates: 0,
      numApiCalls: 0
    }
  },
  computed: {

    items() {
      return [
        {
          text: 'Works',
          icon: 'mdi-file-document-outline',
          value: this.works.count,
        },
        {
          text: 'Authors',
          icon: 'mdi-account-outline',
          value: this.authors
        },
        {
          text: 'Institutions',
          icon: 'mdi-town-hall',
          value: this.institutions
        },
        {
          text: 'Sources',
          icon: 'mdi-book-multiple-outline',
          value: this.sources
        },
        {
          text: 'Pulbishers',
          icon: 'mdi-domain',
          value: this.publishers
        },
        {
          text: 'Funders',
          icon: 'mdi-cash-multiple',
          value: this.funders
        },
        {
          text: 'Open Access Works',
          icon: 'mdi-lock-open-outline',
          value: this.worksOpenAccess
        }
      ]

    }
  },
  async mounted() {
    const self = this
    async function asyncLoadStats() {
      try {
        let url = "https://api.openalex.org/counts?bypass_cache=true"
        let res = await axios.get(url)
        self.numApiCalls++
        console.log(`api GET ${url} success (${self.numApiCalls} API calls):`, res.data)
        const counts = res.data
        self.works.count = new Number(counts.works)
        self.authors = new Number(counts.authors)
        self.institutions = new Number(counts.institutions)
        self.sources = new Number(counts.sources)
        self.publishers = new Number(counts.publishers)
        self.funders = new Number(counts.funders)
        url = "https://api.openalex.org/works?filter=open_access.is_oa:true&bypass_cache=true"
        res = await axios.get(url)
        self.worksOpenAccess = new Number(res.data.meta.count)
        self.numApiCalls++
        console.log(`api GET ${url} success (${self.numApiCalls} API calls):`, res.data)
        self.numUpdates++
        self.loading = false
      } catch (e) {
        // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
        console.log("api GET failure:", e.response)
        throw e
      }
      setTimeout(asyncLoadStats, 30000)
    }
    asyncLoadStats()
  }
}
</script>

<style scoped lang="scss"></style>