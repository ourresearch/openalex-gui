<template>
  <div>
    <v-text-field
            dense
            hide-details
            v-model="myFilterValue"
            :placeholder="myFilterConfig.displayName"
            :label="myFilterConfig.displayName"
            @keypress.enter="$emit('submit')"
            @input="$emit('input', myValue)"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";

export default {
    name: "FilterValueSearch",
    components: {},
    props: {
        readonly: Boolean,
        filterKey: String,
        filterValue: String,
        displayValue: String,

    },
    data() {
        return {
            foo: 42,
            myFilterValue: this.filterValue,
            myFilterKey: this.filterKey,
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
        ]),
        myFilterConfig(){
            return facetConfigs().find(c => c.key === this.myFilterKey)
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
      '$route': {
      immediate: true,
      handler: function (to, from) {
        console.log("FilterValueSearch $route change", to)
      }
    }
    }
}
</script>

<style scoped lang="scss">

</style>