<template>
  <span>
    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <span
            v-bind="attrs"
            v-on="on"
        >
          <v-icon left :small="small">{{entityConfig.icon}}</v-icon>
        </span>
      </template>
      <span>
        <span class="text-capitalize font-weight-bold">{{entityConfig.displayName}}: </span>
        <span>{{entityConfig.descr}}</span>
      </span>
    </v-tooltip>
  </span>
</template>


<script>
import {entityConfigs} from "../entityConfigs";

export default {
  components: {},
  props: {
    type: String,
    small: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    entityConfig(){
      return entityConfigs[this.type]
    }
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