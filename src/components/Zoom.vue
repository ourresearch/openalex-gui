<template>

  <v-dialog
      v-model="zoomIsOpen"
      scrollable
      max-width="500"
  >
<!--    <div>-->
<!--      <div-->
<!--          class="py-2 body-1"-->
<!--          v-if="entityZoomHistoryData.length"-->
<!--          style="background: #fff;"-->
<!--      >-->
<!--        &lt;!&ndash;          {{ entityZoomHistoryData }}&ndash;&gt;-->
<!--        <div-->
<!--            v-for="zoomData in entityZoomHistoryData"-->
<!--            :key="zoomData.id"-->
<!--        >-->
<!--          <router-link-->
<!--              :to="zoomData.id | zoomLink"-->
<!--              class="text-decoration-none px-6 grey&#45;&#45;text"-->
<!--          >-->
<!--            <v-icon small left color="">mdi-history</v-icon>-->
<!--            &lt;!&ndash;              <v-icon small color="primary">{{ getEntityIconFromId(zoomData.id) }}</v-icon>&ndash;&gt;-->
<!--            {{ zoomData.display_name }}-->
<!--          </router-link>-->
<!--        </div>-->
<!--      </div>-->


    <zoom-filter v-if="zoomId && zoomId.indexOf('filters') === 0" />
    <zoom-entity v-else />

  </v-dialog>
</template>


<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import ZoomEntity from "./ZoomEntity";
import ZoomFilter from "./ZoomFilter";


export default {
  components: {
    ZoomEntity,
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
        return !!this.zoomId
      },
      set(newVal) {
        this.$router.push(this.currentUrlWithoutZoom)
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