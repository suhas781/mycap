import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'crm-theme';

function applyThemeNow(value) {
  const next = value === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', next === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
}

export default function ThemeToggle() {
  const ctx = useTheme();
  const theme = ctx?.theme ?? 'light';
  const setTheme = ctx?.setTheme;

  const setLight = (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyThemeNow('light');
    setTheme?.('light');
  };
  const setDark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyThemeNow('dark');
    setTheme?.('dark');
  };

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-100 dark:bg-white/5 p-1 pointer-events-auto">
      <button
        type="button"
        onClick={setLight}
        aria-label="Light theme"
        className={`cursor-pointer select-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
          theme === 'light'
            ? 'bg-white dark:bg-dark text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white'
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={setDark}
        aria-label="Dark theme"
        className={`cursor-pointer select-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-slate-800 dark:bg-dark text-white shadow-sm'
            : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white'
        }`}
      >
        Dark
      </button>
    </div>
  );
}
