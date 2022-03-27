<template>
  <span class="authorship" :class="{showInstitutions}">
    <span class="author">
      <link-author :data="authorship.author" :append-comma="appendCommaComputed" />
    </span>
    <div v-if="showInstitutions">
      <div
          v-for="(institution, i) in authorship.institutions"
          :key="institution.id"
          class="body-2"
      >
        <link-institution v-if="institution.id" :data="institution"/>
        <span v-else>{{ institution.display_name }}</span>
      </div>
    </div>
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
    appendCommaComputed(){
      return this.appendComma && !this.showInstitutions
    }
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
    display: block;
    margin-bottom: 10px;
  }


</style>