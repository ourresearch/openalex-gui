<template>
  <div>
    <v-dialog
        v-model="zoomIsOpen"
        scrollable
        max-width="500"
    >
      <router-view></router-view>
    </v-dialog>
  </div>
</template>


<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import ZoomFilter from "../Facet/FacetsDrawer";


export default {
  components: {
    ZoomFilter,
  },
  props: {
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),
  },
  computed: {
    ...mapGetters([
      "zoomType",
      "entityZoomData",
      "zoomId",
      "zoomTypeConfig",
      "entityZoomHistoryData",
    ]),
    zoomIsOpen: {
      get() {
        return true
        return !!this.zoomId
      },
      set(newVal) {
        // this.$router.push(this.currentUrlWithoutZoom)
        console.log("close zoom")
        this.$router.push({name: "Serp", query:{...this.$route.query}})
      }
    },
    currentUrlWithoutZoom() {
      const newQuery = {...this.$route.query}
      newQuery.zoom = undefined
      return {
        name: this.$route.name,
        params: this.$route.params,
        query: newQuery,
      }
    },
  },
  created() {
  },
  mounted() {
    console.log("loading zoom component")
  },
  watch: {}
}
</script>

<style lang="scss">
.entity-zoom-container {
  //position: absolute;
  //top: 0;
  //right: 0;
  //left: 0;
  //bottom: 0;
}

</style>