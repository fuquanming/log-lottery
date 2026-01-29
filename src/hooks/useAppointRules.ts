import { ref, onMounted } from 'vue'
import type { AppointRule } from '@/types/appoint'

export function useAppointRules() {
  console.log('[useAppointRules] function called')
  const appointRules = ref<AppointRule[]>([])

  async function load() {
    try {
      const res = await fetch('config/appoint-rules.json', { cache: 'no-cache' })
      console.log('[useAppointRules] load called')
      console.log(res)
      if (res.ok) {
        appointRules.value = await res.json()
        console.log('[useAppointRules] load.ok called')
      }
    }
    catch (e) {
      console.error('[useAppointRules] error', e)
    }
  }

  //onMounted(load)
  onMounted(() => {
    console.log('[useAppointRules] onMounted fired')
    load()
  })

  return {
    appointRules,
    reload: load,
  }
}
