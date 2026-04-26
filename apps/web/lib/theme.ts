type Theme = 'light' | 'dark' | 'system'

const KEY = 'unmapped_theme_v1'

function applyTheme(t: Theme) {
  const el = typeof document !== 'undefined' ? document.documentElement : null
  if (!el) return

  if (t === 'dark') {
    el.classList.add('dark')
  } else if (t === 'light') {
    el.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) el.classList.add('dark')
    else el.classList.remove('dark')
  }
}

export function getStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
    return null
  } catch (e) {
    return null
  }
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch (e) {
    // ignore
  }
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent('theme.change'))
}

export function initTheme() {
  const stored = getStoredTheme()
  if (stored) {
    applyTheme(stored)
  } else {
    applyTheme('system')
  }
}

export function toggleTheme() {
  const current = getStoredTheme() || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const next = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
}

export function onThemeChange(handler: () => void) {
  const listener = () => handler()
  window.addEventListener('theme.change', listener as EventListener)
  return () => window.removeEventListener('theme.change', listener as EventListener)
}

export default { getStoredTheme, setTheme, initTheme, toggleTheme, onThemeChange }
