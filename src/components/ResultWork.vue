<template>
  <div>
    <router-link :to="data.id | idLink">
      {{data.display_name}}
    </router-link>
  <div>
    {{ authorsList }}
  </div>
    <div>
      <span>{{ data.publication_year}} </span>
      <span class="font-italic">{{ data.host_venue.display_name }}</span>
    </div>
  </div>

</template>


<script>

export default {
  components: {
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    authorsList(){
      return this.data.authorships.map(a => {
        return a.author.display_name
      }).join(", ")
    },
  },
  created() {},
  mounted() {},
  watch: {}
}
</script>

<style lang="scss">


</style>