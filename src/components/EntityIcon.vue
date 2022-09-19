<template>
  <span>
    <span v-if="expand" class="mr-2 text-capitalize">
      <v-icon  :small="small">{{entityConfig.icon}}</v-icon>
      <span
          style="color: #555;"
          class="body-1"
      >
        {{ (singular) ? entityConfig.displayNameSingular : entityConfig.displayName }}:
      </span>
    </span>
    <span v-else>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <span
              v-bind="attrs"
              v-on="on"
          >
            <v-icon :left="left" :small="small">{{entityConfig.icon}}</v-icon>
          </span>
        </template>
        <span>
          <span class="text-capitalize font-weight-bold">{{entityConfig.displayName}}: </span>
          <span>{{entityConfig.descr}}</span>
        </span>
      </v-tooltip>
    </span>

  </span>

</template>


<script>
import {entityConfigs} from "../entityConfigs";

export default {
  components: {},
  props: {
    type: String,
    small: Boolean,
    expand: Boolean,
    singular: Boolean,
    left: Boolean,
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