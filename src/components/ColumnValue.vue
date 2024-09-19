<template>
  <span>
<!--    <span class="grey&#45;&#45;text">{{ property }}</span>-->
        <template v-if="property.value === null">
            -
          </template>
          <template v-else-if="property.config.type==='string'">

<!--        string: external ID -->
            <a
                v-if="property.value.startsWith('http')"
                :href="property.value"
                target="_blank"
                style="white-space: nowrap"
            >
                    {{ property.value }}<v-icon color="primary" class="pl-1" x-small>mdi-open-in-new</v-icon>
            </a>

            <!--        generic string (including openalex ids) -->
            <template v-else>
              {{ property.value | truncate(100) }}
            </template>
          </template>
          <template v-else-if="property.config.type==='number'">

<!--        number: currency -->
            <template v-if="property.config.isCurrency">
              ${{ property.value | toPrecision }}
            </template>

            <!--        number: year -->
            <template v-else-if="property.config.isYear">
              {{ property.value }}
            </template>

            <!--        number: float or integer -->
            <template v-else>
              {{ property.value | toPrecision }}
            </template>
          </template>

    <!--        boolean -->
          <template v-else-if="property.config.type==='boolean'">
            {{ property.value }}
          </template>


    <!--      entity object (just one) -->
          <template v-else-if="property.config.type==='object'">
            <router-link
                :to="'/'+property.value.id"
            >
                {{ property.value.display_name }}
              </router-link>
            </template>
          <template v-else-if="property.config.type==='array'">

<!--        array: entity objects-->
            <template v-if="isEntityArray(property.value)">
              <router-link
                  v-for="(entity, i) in property.value"
                  :key="'entity-'+i"
                  :to="'/' + entity.id"
              >
                {{ entity?.display_name }}{{ i < property.value.length - 1 ? ', ' : '' }}
              </router-link>
            </template>

            <!--        array: primitives -->
          <template v-else>
            <span
                v-for="(item, i) in property.value"
                :key="'item-'+i"
            >
              {{ item }}{{ i < property.value.length - 1 ? ', ' : '' }}
            </span>
          </template>
        </template>

      </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "ColumnValue",
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
    isEntityArray(arr) {
      return Array.isArray(arr) && arr.length > 0 &&
             typeof arr[0] === 'object' && arr[0] !== null &&
             'id' in arr[0] && 'display_name' in arr[0];
    }
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