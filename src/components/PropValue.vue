<template>
  <span>
<!--    <span class="grey&#45;&#45;text">{{ property }}</span>-->
        <template v-if="property.value === null">
            -
          </template>
          <template v-else-if="property.config.newType==='string'">
            <template v-if="Array.isArray(property.value)">
              <template v-for="(value, i) in property.value">
                {{ value }}{{ i < property.value.length - 1 ? ', ' : '' }}
              </template>
            </template>
            <template v-else-if="typeof property.value === 'string'">
              <template v-if="property.config.isId">
                <template v-if="property.config.key === 'id'"> <!-- OpenAlex IDs -->
                  {{ property.value }}
                </template>
                <template v-else>
                  <a :href="property.value" target="_blank" style="white-space: nowrap">
                    {{ property.value }}<v-icon color="primary" class="pl-1" x-small>mdi-open-in-new</v-icon>
                  </a>
                </template>
              </template>
              <template v-else>
                {{ property.value | truncate(100) }}
              </template>
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
                  :to="'/' + entity.id"
              >
                {{ entity?.display_name }}{{ i < property.value.length - 1 ? ', ' : '' }}
              </router-link>
            </template>
            <template v-else-if="property.value.id">
              <router-link
                  :to="'/'+property.value.id"
              >
                {{ property.value.display_name }}
              </router-link>
            </template>
<!--            <template v-else>-->
<!--              unknown entity:-->
<!--              {{ property }}-->
<!--            </template>-->
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