<template>
  <v-list-item>
    <v-list-item-icon>
      <v-icon>mdi-content-save-outline</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <div>
        {{ filters }}
      </div>
    </v-list-item-content>
    <v-list-item-action>
      <v-btn icon>
        <v-icon>mdi-delete-outline</v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
    name: "UserSavedSearch",
    components: {},
    props: {
        data: Object,
    },
    data() {
        return {
            foo: 42,
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
        ]),
        filters(){
            const url = new URL(this.data.search_url)
            const filterStr = url.searchParams.get("filter")
            return filterStr
        }

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
    }
}
</script>

<style scoped lang="scss">

</style>