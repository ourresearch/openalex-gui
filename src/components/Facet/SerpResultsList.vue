<template>
  <div class="mx-3">
    <div v-if="!resultsCount" class="mt-8 grey--text">
      Sorry, there are no results for this search.
    </div>
    <div
            v-for="result in $store.state.results"
            class="result-container mb-5"
            :key="result.id"
    >
      <component :is="resultComponentName" :data="result"/>
    </div>
    <div class="serp-bottom" v-if="$store.state.results.length">
      <v-pagination
              v-model="page"
              :length="numPages"
              :total-visible="10"
              light
      />
    </div>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import ResultWork from "../ResultWork.vue";
import ResultAuthor from "../ResultAuthor.vue";
import ResultVenue from "../ResultVenue.vue";
import ResultPublisher from "../ResultPublisher.vue";
import ResultInstitution from "../ResultInstitution.vue";
import ResultConcept from "../ResultConcept.vue";

export default {
    name: "SerpResultsList",
    components: {
        ResultWork,
        ResultAuthor,
        ResultVenue,
        ResultPublisher,
        ResultInstitution,
        ResultConcept,
    },
    props: {},
    data() {
        return {
            resultsPerPage: 25, // not editable now, but could be in future
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "resultsCount",
            "entityConfig",
        ]),
        resultComponentName() {
            return "result-" + this.entityConfig.nameSingular

        },
        page: {
            get() {
                return this.$store.state.page
            },
            set(val) {
                this.$store.dispatch("setPage", val)
            }
        },
        numPages() {
            return Math.min(
                Math.ceil(this.$store.state.resultsCount / this.resultsPerPage),
                10
            )
        },
    },

    methods: {
        ...mapMutations([
            "snackbar",
        ]),
        ...mapActions([]),


    },
    created() {
    },
    mounted() {
    },
    watch: {
        isOpen(to, from) {
        }
    }
}
</script>

<style scoped lang="scss">

</style>