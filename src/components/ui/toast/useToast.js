import { ref, computed } from 'vue'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toasts = ref([])

function addToast(toast) {
  const id = toast.id || genId()
  const newToast = { ...toast, id, open: true }
  
  toasts.value = [newToast, ...toasts.value].slice(0, TOAST_LIMIT)
  
  if (toast.duration !== Infinity) {
    setTimeout(() => {
      dismissToast(id)
    }, toast.duration || TOAST_REMOVE_DELAY)
  }
  
  return id
}

function dismissToast(id) {
  toasts.value = toasts.value.map((t) =>
    t.id === id ? { ...t, open: false } : t
  )
  
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 300)
}

function removeToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts: computed(() => toasts.value),
    toast: addToast,
    dismiss: dismissToast,
    remove: removeToast,
  }
}

export function toast(props) {
  return addToast(props)
}
