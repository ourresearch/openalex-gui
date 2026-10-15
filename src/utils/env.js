// oxjob #1689 Nuxt trial: one place to ask "is there a browser here?"
export const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
