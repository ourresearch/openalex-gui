<template>
  <v-card rounded>
    <v-text-field
            v-model="searchString"
            filled
            rounded
            background-color="white"
            :prepend-inner-icon="prependIcon"
            hide-details
            autofocus
            :placeholder="placeholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
            append-outer-icon="mdi-close"
            @keyup.enter="onEnter"
            @click:append-outer="clickCloseSearch"
            @click:prepend-inner="clickPrependIcon"

    />
    <v-divider/>
  </v-card>
</template>


<script>

export default {
  name: "FilterCardSelect",
  components: {},
  props: {
    filterKey: String,
  },
  data() {
    return {
      searchString: "",
    }
  },
}
</script>


<style scoped lang="scss">

</style>