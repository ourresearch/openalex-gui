import { ref, computed, onMounted, onUnmounted } from 'vue'

// Tailwind default breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useBreakpoints() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  const updateWidth = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  // Exact breakpoint checks
  const xs = computed(() => width.value < breakpoints.sm)
  const sm = computed(() => width.value >= breakpoints.sm && width.value < breakpoints.md)
  const md = computed(() => width.value >= breakpoints.md && width.value < breakpoints.lg)
  const lg = computed(() => width.value >= breakpoints.lg && width.value < breakpoints.xl)
  const xl = computed(() => width.value >= breakpoints.xl && width.value < breakpoints['2xl'])
  const xxl = computed(() => width.value >= breakpoints['2xl'])

  // "And up" checks (like Tailwind's responsive prefixes)
  const smAndUp = computed(() => width.value >= breakpoints.sm)
  const mdAndUp = computed(() => width.value >= breakpoints.md)
  const lgAndUp = computed(() => width.value >= breakpoints.lg)
  const xlAndUp = computed(() => width.value >= breakpoints.xl)
  const xxlAndUp = computed(() => width.value >= breakpoints['2xl'])

  // "And down" checks (for Vuetify compatibility)
  const smAndDown = computed(() => width.value < breakpoints.md)
  const mdAndDown = computed(() => width.value < breakpoints.lg)
  const lgAndDown = computed(() => width.value < breakpoints.xl)
  const xlAndDown = computed(() => width.value < breakpoints['2xl'])

  // Mobile check (common use case)
  const mobile = computed(() => width.value < breakpoints.md)

  return {
    width,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    smAndUp,
    mdAndUp,
    lgAndUp,
    xlAndUp,
    xxlAndUp,
    smAndDown,
    mdAndDown,
    lgAndDown,
    xlAndDown,
    mobile,
  }
}
