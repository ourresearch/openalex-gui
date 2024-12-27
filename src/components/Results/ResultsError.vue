<template>
  <div class="table-meta d-flex align-center pa-8"  style="height: 140px;">
  <span>
  <b>Search error:</b> {{$store.state.search.backend_error}}
  </span>
  </div>
</template>

<script>


export default {
  name: "ResultsError",
}
</script>


<style scoped lang="scss">

</style>