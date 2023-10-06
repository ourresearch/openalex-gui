<template>
  <v-container class="page">
    <h3 class="text-h3">OpenAlex Stats</h3>
    <v-card class="mx-auto" max-width="800px">
      <v-progress-circular v-if="loading" />
      <v-list v-else>
        <v-list-item v-for="(item, i) in items" :key="i">
          <v-list-item-icon>
            <v-icon v-text="item.icon"></v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <div>
              {{ item.text }}
              <v-chip large>{{ item.value.toLocaleString() }}</v-chip>
            </div>
          </v-list-item-content>
          <!-- {{ key }}: {{ new Number(stats.counts[key]).toLocaleString() }} -->
        </v-list-item>
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
      counts: {
        works: null,
      },
      loading: true,
      numApiCalls: 0
    }
  },
  computed: {

    items() {
      return [
        {
          text: 'Number of works',
          icon: 'mdi-file-document-outline',
          value: this.counts.works
        }
      ]

    }
  },
  async mounted() {
    const self = this
    async function asyncLoadStats() {
      try {
        const url = "https://api.openalex.org/counts"
        const res = await axios.get(url)
        self.numApiCalls++
        console.log(`api GET ${url} success (${self.numApiCalls} API calls):`, res.data)
        const counts = res.data
        self.counts.works = new Number(counts.works)
        self.loading = false
      } catch (e) {
        // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
        console.log("api GET failure:", e.response)
        throw e
      }
      setTimeout(asyncLoadStats, 10000)
    }
    asyncLoadStats()
  }
}
</script>

<style scoped lang="scss"></style>