<template>
  <span>
        <template v-if="property.value === null">
            -
          </template>
          <template v-else-if="property.config.newType==='string'">
            <template v-if="Array.isArray(property.value)">
              Array of strings...
            </template>
            <template v-else-if="typeof property.value === 'String'">
              {{ property.value | truncate(100) }}
            </template>
            <template v-else>
              {{ property.value }}
            </template>

          </template>
          <template v-else-if="property.config.newType==='number'">
            <template v-if="property.config.isCurrency">
              ${{ property.value | toPrecision }}
            </template>
            <template v-else-if="property.config.isYear">
              {{ property.value }}
            </template>
            <template v-else>
              {{ property.value | toPrecision }}
            </template>
          </template>
          <template v-else-if="property.config.newType==='boolean'">
            {{ property.value }}
          </template>
          <template v-else-if="property.config.newType==='entity'">
            <template v-if="Array.isArray(property.value)">
              <router-link
                  v-for="(entity, i) in property.value"
                  :key="'entity-'+i"
                  :to="{name: 'EntityPage', params: {entityType: property.config.objectEntity, entityId: entity?.id}}"
              >
                {{ entity?.display_name }}{{ i < property.value.length - 1 ? ', ' : '' }}
              </router-link>
            </template>
            <template v-else-if="property.value.id">
              <router-link
                  :to="{name: 'EntityPage', params: {entityType: property.config.objectEntity, entityId: property.value.id}}">
                {{ property.value.display_name }}
              </router-link>
            </template>
            <template v-else-if="property.config.isId">
              <a :href="property.value" target="_blank">{{property.value}} <v-icon x-small>mdi-open-in-new</v-icon></a>
            </template>

            <template v-else>
              PROPERTY WE DONT KNOW HOW TO HANDLE:
              {{ property.value }} ({{ property.config.newType }})
            </template>
          </template>

      </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    property: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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