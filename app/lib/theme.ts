export function applyTheme(theme: string) {
  const root = document.documentElement

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', 'light')
  }

  localStorage.setItem('theme', theme)
}

export function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light'
  applyTheme(saved)
  return saved
}