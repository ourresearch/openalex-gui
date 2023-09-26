<template>
  <router-link
          :to="data.id | entityZoomLink"
          style="display: inline-block; white-space: nowrap;"
          class="text-decoration-none"
  >

    {{ data.display_name }}<v-tooltip bottom v-if="isCorresponding">
      <template v-slot:activator="{on}">
        <v-icon class="ml-1" v-on="on" small color="primary">mdi-email-outline</v-icon>
      </template>
      Corresponding author
    </v-tooltip>{{ append }}
  </router-link>

</template>


<script>

export default {
    components: {},
    props: {
        data: Object,
        append: String,
        isCorresponding: Boolean,
    },
    data() {
        return {
            foo: 42,
        }
    },
    methods: {},
    computed: {},
    created() {
    },
    mounted() {
    },
    watch: {}
}
</script>

<style lang="scss">


</style>