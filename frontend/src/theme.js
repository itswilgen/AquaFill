export const DEFAULT_THEME = 'blue';

export const THEME_PALETTES = {
  blue: {
    '--theme-accent': '#185FA5',
    '--theme-accent-soft': '#EBF4FF',
    '--theme-accent-border': '#B5D4F4',
    '--theme-link': '#0369a1',
    '--theme-page-bg': '#f0f9ff',
    '--theme-page-border': '#e0f2fe',
  },
  green: {
    '--theme-accent': '#14532d',
    '--theme-accent-soft': '#D1FAE5',
    '--theme-accent-border': '#6EE7B7',
    '--theme-link': '#064E3B',
    '--theme-page-bg': '#E6F7EE',
    '--theme-page-border': '#86EFAC',
  },
};

export function getStoredTheme() {
  try {
    const saved = localStorage.getItem('ui_theme');
    if (saved && THEME_PALETTES[saved]) return saved;
  } catch {
    // ignore localStorage access issues
  }
  return DEFAULT_THEME;
}

export function applyTheme(themeName) {
  if (typeof document === 'undefined') return;
  const theme = THEME_PALETTES[themeName] ? themeName : DEFAULT_THEME;
  const palette = THEME_PALETTES[theme];

  Object.entries(palette).forEach(([token, value]) => {
    document.documentElement.style.setProperty(token, value);
  });
}
