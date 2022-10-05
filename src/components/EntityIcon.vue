<template>
  <span>
    <span v-if="expand" class="mr-2 text-capitalize">
      <v-icon
          :small="small"
          :large="large"
          :x-large="xLarge"
          :color="color"
      >
        {{ entityConfig.icon }}
      </v-icon>
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
            <v-icon
                :left="left"
                :small="small"
                :large="large"
                :x-large="xLarge"
                :color="color"
                style="vertical-align: unset;"
            >
              {{ entityConfig.icon }}
            </v-icon>
          </span>
        </template>
        <span>
          <span class="text-capitalize font-weight-bold">{{ entityConfig.displayName }}: </span>
          <span>{{ entityConfig.descr }}</span>
        </span>
      </v-tooltip>
    </span>

  </span>

</template>


<script>
import {entityConfigs} from "../entityConfigs";
import {entityTypeFromId} from "../util";

export default {
  components: {},
  props: {
    // one of these two is required
    type: String,
    id: String,

    // these are optional
    small: Boolean,
    large: Boolean,
    xLarge: Boolean,
    expand: Boolean,
    singular: Boolean,
    left: Boolean,
    color: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    entityConfig() {
      return entityConfigs[this.entityType]
    },
    entityType() {
      if (this.type) return this.type
      else if (this.id) return entityTypeFromId(this.id)
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


</style>