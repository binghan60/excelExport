import Swal from 'sweetalert2'
import { useTheme } from './useTheme.js'

export function useSwal() {
  const { isDark } = useTheme()

  function fire(options) {
    return Swal.fire({
      ...(isDark.value ? {
        background: '#1e293b',
        color: '#f1f5f9',
        iconColor: options?.icon === 'success' ? '#34d399'
                 : options?.icon === 'error'   ? '#f87171'
                 : undefined,
      } : {}),
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: isDark.value ? '#475569' : '#94a3b8',
      ...options,
    })
  }

  return { fire }
}
