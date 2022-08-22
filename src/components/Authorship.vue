<template>
  <span class="authorship" :class="{showInstitutions}">
    <span class="author">
      <link-author :data="authorship.author" :append="appendToAuthorLink" />
    </span>

    <span v-if="showInstitutions">
      (<span
          v-for="(institution, i) in authorship.institutions"
          :key="institution.id"
          class=""
      >
        <link-institution
            v-if="institution.id"
            :data="institution"
            :append="(i<authorship.institutions.length - 1) ? ', ' : ''"
        />
        <span v-else>{{ institution.display_name }}</span>
      </span>){{ (appendComma) ? ";": ""}}
    </span>
  </span>
</template>


<script>
import LinkAuthor from "./LinkAuthor";
import LinkInstitution from "./LinkInstitution";

export default {
  name: "Authorship",
  components: {
    LinkAuthor,
    LinkInstitution,
  },
  props: {
    authorship: Object,
    appendComma: Boolean,
    showInstitutions: Boolean
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    symbolToAppend(){
      if (!this.appendComma) return ""
      return (this.showInstitutions) ? ";" : ","
    },
    appendToAuthorLink(){
        return (!this.institutionsToShow.length) ?  this.symbolToAppend : ""
    },
    appendToAuthorship(){

    },
    institutionsToShow(){
      return (this.showInstitutions) ? this.authorship.institutions : []
    },
    appendCommaComputed(){
      return this.appendComma && !this.showInstitutions
    },
    appendSemicolonComputed(){
      return this.appendComma && this.showInstitutions
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss" scoped>
  span.authorship.showInstitutions {
    //display: block;
    //margin-bottom: 10px;
  }


</style>