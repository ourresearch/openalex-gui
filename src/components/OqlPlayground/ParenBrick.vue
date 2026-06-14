<template>
  <!-- A `(` or `)` brick with the value-group dropdown { Add value, Add clause,
       Negate, Remove group } (oxjob #428 iter 20). `wide` fills the SubclauseBox
       gutter column; otherwise it's a narrow inline mini-brick. -->
  <v-menu location="bottom start" offset="4">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="paren-brick" :class="{ wide }">{{ label }}</span>
    </template>
    <v-card min-width="190" class="menu-card"><v-list density="compact" class="py-0">
      <v-list-item v-for="a in actions" :key="a.key" :title="a.title"
        :prepend-icon="a.icon" @click="a.run()" />
    </v-list></v-card>
  </v-menu>
</template>

<script setup>
defineOptions({ name: "ParenBrick" });
defineProps({
  label: { type: String, required: true },          // "(" or ")"
  actions: { type: Array, default: () => [] },       // [{ key, title, icon, run }]
  wide: { type: Boolean, default: false },           // fill the gutter column
});
</script>

<style scoped>
/* Paren blocks are primary CLICKABLE controls now (not inert language features like
   find/where, which stay gray) — so they're black to read as buttons (Jason iter 21). */
.paren-brick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 7px;
  border-radius: 4px;
  background: #000;
  color: #fff;
  font-size: var(--brick-fs, 0.8125rem);
  font-weight: 600;
  cursor: pointer;
}
.paren-brick:hover { background: rgba(0, 0, 0, 0.8); }
.paren-brick.wide { width: var(--conn-w); padding: 0; }
.menu-card { overflow: hidden; }
</style>
