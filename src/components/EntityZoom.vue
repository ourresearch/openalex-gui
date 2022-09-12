<template>

  <div class="entity-zoom-container pa-5" v-if="entityZoomData">
    <div class="caption text-capitalize">
      <entity-icon :type="zoomType" small/>
      <span>{{ zoomTypeConfig.displayNameSingular }}</span>

      <span v-if="zoomType === 'works' && entityZoomData.type">
        ({{ entityZoomData.type.replace("-", " ") }})
      </span>
      <span v-if="zoomType=== 'institutions' && entityZoomData.type">
         ({{ entityZoomData.type.replace("-", " ") }})
      </span>
      <span v-if="zoomType=== 'concepts'">
         (Level {{ entityZoomData.level }})
      </span>
    </div>

    <div class="text-h5 mb-3">{{ entityZoomData.display_name }}</div>


    <entity-work v-if="zoomType==='works'" :data="entityZoomData"/>
    <entity-author v-if="zoomType==='authors'" :data="entityZoomData"/>
    <entity-venue v-if="zoomType==='venues'" :data="entityZoomData"/>
    <entity-institution v-if="zoomType==='institutions'" :data="entityZoomData"/>
    <entity-concept v-if="zoomType==='concepts'" :data="entityZoomData"/>

  </div>
</template>


<script>
import EntityWork from "./EntityWork";
import EntityAuthor from "./EntityAuthor";
import EntityVenue from "./EntityVenue";
import EntityInstitution from "./EntityInstitution";
import EntityConcept from "./EntityConcept";
import EntityIcon from "./EntityIcon";

import {mapActions, mapGetters, mapMutations} from "vuex";


export default {
  components: {
    EntityWork,
    EntityAuthor,
    EntityVenue,
    EntityInstitution,
    EntityConcept,
    EntityIcon,
  },
  props: {
    data: Object,
    append: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    ...mapGetters([
      "zoomType",
      "entityZoomData",
      "zoomTypeConfig",
    ]),
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
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}

</style>