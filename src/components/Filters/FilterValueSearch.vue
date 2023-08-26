<template>
  <div>
    <v-text-field
            autofocus
            prepend-inner-icon="mdi-magnify"
            flat
            hide-details
            v-model="myValue"
            :placeholder="myFilterConfig.displayName"
            :label="myFilterConfig.displayName"
            outlined
            @keypress.enter="$emit('change', myValue)"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";

export default {
    name: "FilterValueSearch",
    components: {},
    props: {
        readonly: Boolean,
        filterKey: String,
        value: String,
        displayValue: String,
    },
    data() {
        return {
            foo: 42,
            myValue: this.value,
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
    watch: {}
}
</script>

<style scoped lang="scss">

</style>