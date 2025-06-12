<template>
  <div v-if="data && isDisplayed">
    
    <span class="font-weight-bold">
      <template v-if="isValueAnArray">
          {{ filters.pluralize(filters.capitalize(filterConfig.displayName), pluralizeCount) }}:
      </template>
      <template v-else>
        {{ filters.capitalize(filterConfig.displayName) }}:
      </template>
    </span>

    <span v-if="valueEntityLinks">
      <router-link
          v-for="(entityObj, i) in valueEntityLinks"
          :key="entityObj.id + i"
          :to="filters.entityZoomLink(entityObj.id)"
          class="mr-1 pr-0"
      >
        {{ entityObj.display_name }}{{ i + 1 < valueEntityLinks.length ? ", " : "" }}
      </router-link>
    </span>

    <span v-if="valueListOfStrings">
      <span
          v-for="(str, i) in valueListOfStrings"
          :key="str + i"
          class="mr-1 pr-0"
      >
        {{ str }}{{ i + 1 < valueListOfStrings.length ? ", " : "" }}
      </span>
    </span>

    <span v-else-if="valueExternalLink">
      <a :href="valueExternalLink" target="_blank">
        Yes
        <v-icon size="small" style="vertical-align: 0px;" color="primary">mdi-open-in-new</v-icon>
      </a>
    </span>

    <span v-else-if="valueString">
      <span>{{ valueString }}{{ isValueTruncated ? "..." : "" }}</span>
    </span>

    <span v-else-if="valueWorksCount">
      <router-link :to="filters.entityZoomLink(data.id)">
        {{ filters.toPrecision(valueWorksCount) }}
      </router-link>
    </span>

    <span v-else-if="valueUnlinkedCount">
      <span>{{ isValueUsd ? "$"  : ""}}{{ filters.toPrecision(valueUnlinkedCount) }}</span>
    </span>

    <span v-else-if="valueLinkedCount">
      <router-link :to="url.makeFilterRoute(entityType, this.filterKeyForMakingLinks, data.id)">
        {{ filters.toPrecision(valueLinkedCount) }}
      </router-link>
    </span>

    <span v-else-if="valueBoolean">
      {{ valueBoolean }}
    </span>


    <a
      v-if="isValueTruncated"
      @click="isTruncateSet = false"
      class="font-weight-bold text-primary"
    >
      <template v-if="isValueAnArray">
        +{{ filters.toPrecision(valueLength - maxLen.array) }} more
      </template>
      <template v-else>
        more
      </template>
    </a>
    <a
      v-if="isValueSubjectToTruncation && !isValueTruncated"
      @click="isTruncateSet = true"
      class="font-weight-bold"
    >
      (less)
    </a>

  </div>
</template>


<script>

import {mapGetters} from "vuex";
import filters from '@/filters';
import {url} from "@/url";
import {getFacetConfig} from "@/facetConfigs";
import {entityTypeFromId} from "../../util";
import {getEntityConfig} from "@/entityConfigs";

export default {
  name: "EntityDatumRow",
  components: {},
  props: {
    filterKey: String,
    type: String, // my entity type
    data: Object,
  },
  data() {
    return {
      isTruncateSet: true,

      // old
      maxStringLen: 200,
      maxArrayLen: 5,

      // new
      maxLen: {
        string: 200,
        array: 5,
      },
      url,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    filterConfig() {
      return getFacetConfig(this.myEntityType, this.filterKey)
    },
    myEntityType() {
      return this.type
    },
    myEntityConfig() {
      return getEntityConfig(this.type)
    },
    myValueType() {
      if (Array.isArray(this.rawValue)) return "array"
      return typeof this.rawValue
    },
    rawValue() {
      return this.filterConfig.extractFn(this.data)
    },
    value() {
      if (this.isValueTruncated) {
        return this.rawValue.substring(0, this.maxStringLen)
      }
      return this.rawValue
    },
    isDisplayed() {
      if (this.isValueAnArray) return !!this.rawValue.length
      return this.rawValue !== null && this.rawValue !== undefined
    },
    isValueAnArray() {
      return (Array.isArray(this.rawValue))
    },
    valueLength() {
      return this.rawValue?.length
    },
    valueEntityLinks() {
      if (this.rawValue?.id) {
        return [this.rawValue]
      } else if (this.isValueAnArray && this.rawValue.every(o => !!o.id)) {
        return this.isValueTruncated ?
            this.rawValue.slice(0, this.maxLen.array) :
            this.rawValue
      }
      return null;
    },
    valueListOfStrings() {
      if (this.isValueAnArray && !this.rawValue.every(o => !!o.id)) {
        return this.isValueTruncated ?
            this.rawValue.slice(0, this.maxLen.array) :
            this.rawValue
      }
      return null;
    },
    valueString() {
      if (this.filterConfig.key === "publication_year") return this.rawValue; // yikes
      if (typeof this.rawValue === "string") {
        return (this.isValueTruncated) ?
          this.rawValue.substring(0, this.maxStringLen) :
          this.rawValue
      }
      return null;
    },
    valueWorksCount() {
      return (this.filterKey === "works_count") ? this.rawValue : null;
    },
    valueUnlinkedCount() {
      return (typeof this.rawValue === "number" && this.filterConfig.type !== "select") ? this.rawValue : null;
    },
    isValueUsd() {
      return this.filterKey === "apc_paid.value_usd"
    },
    valueLinkedCount() {
      return (typeof this.rawValue === "number" && this.filterConfig.type === "select") ? this.rawValue : null;
    },
    valueExternalLink() {
      return (typeof this.rawValue !== "string") ? null : this.rawValue?.indexOf("http") === 0 ? this.rawValue : null;
    },
    valueBoolean() {
      return (typeof this.rawValue === "boolean") ? (this.rawValue ? "Yes" : "No") : null;
    },
    // what type of DatumRow are we making
    isValueAListOfEntityLinks() {
      return this.filterConfig.type === "select" && this.filterConfig.isMultiple
    },
    // truncation
    isValueTruncated() {
      return this.isValueSubjectToTruncation && this.isTruncateSet
    },
    isValueSubjectToTruncation() {
      const isTruncatableType = ["string", "array"].includes(this.myValueType)
      const maxLen = this.maxLen[this.myValueType]
      return isTruncatableType && this.rawValue.length > maxLen
    },
    // utility
    pluralizeCount() {
      if (this.filterKey === "cites") return 2
      if (this.filterConfig.displayName.endsWith(")")) return 1
      return this.isValueAnArray && this.rawValue?.length > 1 ?
          2 :
          1
    },
    filterKeyForMakingLinks() {
      if (this.filterKey === "cites") return "cited_by"
      else if (this.filterKey === "cited_by") return "cites"
      else return this.filterKey
    },
  },
  methods: {
    entityTypeFromId,
  },
}
</script>


<style scoped lang="scss">
a {
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

</style>