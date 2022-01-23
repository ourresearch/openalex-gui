<template>
  <div>
    <router-link :to="data.id | idLink">
      {{ data.display_name }}
    </router-link>
    <div>
      {{ authorsList }}
    </div>
    <div>
      <span>{{ data.publication_year }} </span>
      <span class="font-italic">{{ data.host_venue.display_name }}</span>
    </div>
    <div>
      <span>Cited by {{ data.cited_by_count }}</span>
      <a
          :href="data.host_venue.url"
          target="_blank"
          class="mx-3"
      >
        <template v-if="workIsFreeAtPublisher">Open Access</template>
        <template v-if="!workIsFreeAtPublisher">paywalled</template>
      </a>
      <a
          :href="data.open_access.oa_url"
          class=""
          target="_blank"
          v-if="data.open_access.oa_status==='green'"
      >
        free at {{ oaUrlHostname }}
      </a>
    </div>
  </div>
</template>


<script>

export default {
  components: {},
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
      return this.data.open_access.is_oa && this.data.open_access.oa_status !== "green"
    },
    authorsList() {
      return this.data.authorships.map(a => {
        return a.author.display_name
      }).join(", ")
    },
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