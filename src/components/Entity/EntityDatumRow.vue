<template>
  <div v-if="data && isDisplayed">
    
    <span class="font-weight-bold">
      <template v-if="isValueAnArray">
          {{ filterConfig.displayName | capitalize | pluralize(pluralizeCount) }}
      </template>
      <template v-else>
        {{ filterConfig.displayName | capitalize }}:
      </template>
    </span>

    <span v-if="valueEntityLinks">
      <router-link
          v-for="(entityObj, i) in valueEntityLinks"
          :key="entityObj.id + i"
          :to="entityObj.id | entityZoomLink"
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
        <v-icon small style="vertical-align: 0px;" color="primary">mdi-open-in-new</v-icon>
      </a>
    </span>

    <span v-else-if="valueString">
      <span>{{ valueString }}{{ isValueTruncated ? "..." : "" }}</span>
    </span>

    <span v-else-if="valueWorksCount">
      <router-link :to="data.id | entityWorksLink">
        {{ valueWorksCount | toPrecision }}
      </router-link>
    </span>

    <span v-else-if="valueUnlinkedCount">
      <span>{{ isValueUsd ? "$"  : ""}}{{ valueUnlinkedCount | toPrecision }}</span>
    </span>

    <span v-else-if="valueLinkedCount">
      <router-link :to="url.makeFilterRoute(entityType, this.filterKeyForMakingLinks, data.id)">
        {{ valueLinkedCount | toPrecision }}
      </router-link>
    </span>

    <span v-else-if="valueBoolean">
      {{ valueBoolean }}
    </span>


    <a
        v-if="isValueTruncated"
        @click="isTruncateSet = false"
        class="font-weight-bold"
    >
      <template v-if="isValueAnArray">
        +{{ (valueLength - maxLen.array) | toPrecision }} more
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

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
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
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
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
    },
    valueListOfStrings() {
      if (this.isValueAnArray && !this.rawValue.every(o => !!o.id)) {
        return this.isValueTruncated ?
            this.rawValue.slice(0, this.maxLen.array) :
            this.rawValue
      }
    },
    valueString() {
      if (this.filterConfig.key === "publication_year") return this.rawValue; // yikes
      if (typeof this.rawValue === "string") return (this.isValueTruncated) ?
          this.rawValue.substring(0, this.maxStringLen) :
          this.rawValue
    },
    valueWorksCount() {
      if (this.filterKey === "works_count") return this.rawValue
    },
    valueUnlinkedCount() {
      if (typeof this.rawValue === "number" && this.filterConfig.type !== "select") return this.rawValue
    },
    isValueUsd() {
      return this.filterKey === "apc_paid.value_usd"
    },
    valueLinkedCount() {
      if (typeof this.rawValue === "number" && this.filterConfig.type === "select") return this.rawValue
    },
    valueExternalLink() {
      if (typeof this.rawValue !== "string") return // throws error without this for some reason
      if (this.rawValue?.indexOf("http") === 0) return this.rawValue
    },
    valueBoolean() {
      if (typeof this.rawValue === "boolean") return this.rawValue ?
          "Yes" :
          "No"
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