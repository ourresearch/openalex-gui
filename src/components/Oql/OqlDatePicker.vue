<!--
  OqlDatePicker — the Linear-style date picker body (type-a-date input + month
  calendar + "Today"), extracted from OqlDateChip (oxjob #428 toolbar move). It used
  to live inside the date chip's popover; now the chip is display-only and the picker
  is hosted in the builder's toolbar "Edit" popover. Purely presentational: it takes
  the current ISO value and emits `pick` with the chosen ISO date.

  Props
    value   the committed ISO date string (or empty).
  Emits
    pick (isoString)   a day was clicked / a typed date was confirmed.
-->
<template>
  <div class="date-pop">
    <!-- type-a-date input (Linear's hallmark) -->
    <div class="dp-input-wrap">
      <v-icon size="16" class="dp-input-icon">mdi-calendar-blank-outline</v-icon>
      <input ref="inputEl" v-model="typed" class="dp-input" spellcheck="false"
        placeholder="Type a date…" @keydown="onTypedKeydown" />
    </div>
    <div v-if="typed && parsedTyped" class="dp-parsed" @click="$emit('pick', toISO(parsedTyped))">
      {{ toISO(parsedTyped) }}
      <span class="dp-parsed-hint">↵</span>
    </div>
    <div v-else-if="typed" class="dp-parsed dp-parsed-none">Can’t read that date</div>

    <!-- month header -->
    <div class="dp-head">
      <button class="dp-nav" type="button" @click="shiftMonth(-1)" aria-label="Previous month">
        <v-icon size="18">mdi-chevron-left</v-icon>
      </button>
      <span class="dp-title">{{ MONTHS[viewM - 1] }} {{ viewY }}</span>
      <button class="dp-nav" type="button" @click="shiftMonth(1)" aria-label="Next month">
        <v-icon size="18">mdi-chevron-right</v-icon>
      </button>
    </div>

    <!-- weekday row -->
    <div class="dp-grid dp-dow">
      <span v-for="(d, i) in DOW" :key="i" class="dp-dowcell">{{ d }}</span>
    </div>

    <!-- day grid -->
    <div class="dp-grid">
      <button v-for="cell in grid" :key="cell.iso" type="button" class="dp-day"
        :class="{ muted: !cell.inMonth, today: cell.isToday, selected: cell.isSelected }"
        @click="$emit('pick', cell.iso)">{{ cell.d }}</button>
    </div>

    <!-- footer: Today only (Negate/Delete are toolbar buttons now) -->
    <div class="dp-foot">
      <button class="dp-foot-btn" type="button" @click="$emit('pick', toISO(today()))">Today</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted } from "vue";

const props = defineProps({
  value: { type: String, default: "" },
});
const emit = defineEmits(["pick"]);

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

// ---- date helpers (local, no dependency) -----------------------------------
const pad = (n) => String(n).padStart(2, "0");
const toISO = (p) => `${p.y}-${pad(p.m)}-${pad(p.d)}`;
const today = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; };
const fromDate = (d) => ({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() });
const shift = (p, days) => fromDate(new Date(p.y, p.m - 1, p.d + days));
const valid = (y, m, d) => {
  if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1)) return false;
  return d <= new Date(y, m, 0).getDate();
};

const parseStrict = (str) => {
  const s = String(str || "").trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))
    return valid(+m[1], +m[2], +m[3]) ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  if ((m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)))
    return valid(+m[1], +m[2], +m[3]) ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))
    return valid(+m[3], +m[1], +m[2]) ? { y: +m[3], m: +m[1], d: +m[2] } : null;
  if ((m = s.match(/^(\d{4})-(\d{1,2})$/)))
    return valid(+m[1], +m[2], 1) ? { y: +m[1], m: +m[2], d: 1 } : null;
  if ((m = s.match(/^(\d{4})$/))) return { y: +m[1], m: 1, d: 1 };
  return null;
};

const parseTyped = (str) => {
  const s = String(str || "").trim().toLowerCase();
  if (!s) return null;
  const strict = parseStrict(s);
  if (strict) return strict;
  if (s === "today" || s === "now") return today();
  if (s === "yesterday") return shift(today(), -1);
  if (s === "tomorrow") return shift(today(), 1);
  let m;
  if ((m = s.match(/^(last|next)\s+(week|month|year)$/))) {
    const sign = m[1] === "last" ? -1 : 1;
    const t = today();
    if (m[2] === "week") return shift(t, 7 * sign);
    if (m[2] === "month") return fromDate(new Date(t.y, t.m - 1 + sign, t.d));
    return { y: t.y + sign, m: t.m, d: t.d };
  }
  const monthIdx = (w) => MONTHS.findIndex((mn) => mn.toLowerCase().startsWith(w));
  if ((m = s.match(/^([a-z]{3,})\s+(\d{1,2})(?:,)?\s+(\d{4})$/))) {
    const mi = monthIdx(m[1]); if (mi >= 0 && valid(+m[3], mi + 1, +m[2])) return { y: +m[3], m: mi + 1, d: +m[2] };
  }
  if ((m = s.match(/^(\d{1,2})\s+([a-z]{3,})\s+(\d{4})$/))) {
    const mi = monthIdx(m[2]); if (mi >= 0 && valid(+m[3], mi + 1, +m[1])) return { y: +m[3], m: mi + 1, d: +m[1] };
  }
  if ((m = s.match(/^([a-z]{3,})\s+(\d{4})$/))) {
    const mi = monthIdx(m[1]); if (mi >= 0) return { y: +m[2], m: mi + 1, d: 1 };
  }
  return null;
};

const parsedValue = computed(() => parseStrict(props.value));

const inputEl = ref(null);
const typed = ref("");
const parsedTyped = computed(() => parseTyped(typed.value));
const viewY = ref((parsedValue.value || today()).y);
const viewM = ref((parsedValue.value || today()).m);

const grid = computed(() => {
  const y = viewY.value, m = viewM.value;
  const firstDow = new Date(y, m - 1, 1).getDay();
  const start = new Date(y, m - 1, 1 - firstDow);
  const t = today(), sel = parsedValue.value;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const p = fromDate(d);
    cells.push({
      ...p, iso: toISO(p),
      inMonth: p.m === m && p.y === y,
      isToday: p.y === t.y && p.m === t.m && p.d === t.d,
      isSelected: !!sel && p.y === sel.y && p.m === sel.m && p.d === sel.d,
    });
  }
  return cells;
});

const shiftMonth = (delta) => {
  const d = new Date(viewY.value, viewM.value - 1 + delta, 1);
  viewY.value = d.getFullYear(); viewM.value = d.getMonth() + 1;
};

const onTypedKeydown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); e.stopPropagation();
    if (parsedTyped.value) emit("pick", toISO(parsedTyped.value));
  }
};
onMounted(() => { nextTick(() => inputEl.value?.focus?.()); });
</script>

<style scoped>
.date-pop { padding: 8px; }

.dp-input-wrap {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 6px;
  padding: 5px 8px; margin-bottom: 4px;
}
.dp-input-icon { color: rgba(0, 0, 0, 0.4); }
.dp-input {
  border: none; outline: none; background: transparent; width: 100%;
  font-size: 0.8125rem; color: rgba(0, 0, 0, 0.87);
}
.dp-input::placeholder { color: rgba(0, 0, 0, 0.38); }

.dp-parsed {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.78rem; color: #14625c; cursor: pointer;
  padding: 4px 8px; margin-bottom: 4px; border-radius: 6px;
  background: rgba(20, 98, 92, 0.08);
}
.dp-parsed:hover { background: rgba(20, 98, 92, 0.14); }
.dp-parsed-hint { color: rgba(20, 98, 92, 0.6); font-size: 0.85rem; }
.dp-parsed-none { color: rgba(0, 0, 0, 0.4); background: transparent; cursor: default; }
.dp-parsed-none:hover { background: transparent; }

.dp-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 2px 2px 4px;
}
.dp-title { font-size: 0.82rem; font-weight: 600; color: rgba(0, 0, 0, 0.82); }
.dp-nav {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px; color: rgba(0, 0, 0, 0.55);
  background: transparent; border: none; cursor: pointer;
}
.dp-nav:hover { background: rgba(0, 0, 0, 0.06); color: rgba(0, 0, 0, 0.85); }

.dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
.dp-dow { margin-bottom: 2px; }
.dp-dowcell {
  text-align: center; font-size: 0.68rem; font-weight: 600;
  color: rgba(0, 0, 0, 0.38); padding: 2px 0;
}
.dp-day {
  display: inline-flex; align-items: center; justify-content: center;
  height: 30px; border-radius: 6px; border: none; background: transparent;
  font-size: 0.78rem; color: rgba(0, 0, 0, 0.82); cursor: pointer;
}
.dp-day:hover { background: rgba(0, 0, 0, 0.06); }
.dp-day.muted { color: rgba(0, 0, 0, 0.28); }
.dp-day.today { box-shadow: 0 0 0 1px rgba(20, 98, 92, 0.45) inset; }
.dp-day.selected, .dp-day.selected:hover {
  background: #14625c; color: #fff; font-weight: 600; box-shadow: none;
}

.dp-foot {
  display: flex; align-items: center; gap: 4px;
  margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.dp-foot-btn {
  font-size: 0.75rem; color: rgba(0, 0, 0, 0.6); background: transparent;
  border: none; border-radius: 5px; padding: 3px 8px; cursor: pointer;
}
.dp-foot-btn:hover { background: rgba(0, 0, 0, 0.06); color: rgba(0, 0, 0, 0.85); }
</style>
