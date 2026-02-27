import { useState, useRef, useEffect } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateForInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const totalCells = startPad + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const grid = [];
  for (let i = 0; i < startPad; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  const remaining = rows * 7 - grid.length;
  for (let i = 0; i < remaining; i++) grid.push(null);
  return grid;
}

export default function CalendarPopover({ value, onChange, minDate = null, maxDate = null, triggerLabel, placeholder = 'Select date', className = '' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = parseDate(value) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const ref = useRef(null);

  const valueDate = parseDate(value);

  useEffect(() => {
    if (!open) return;
    const d = valueDate || new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = getDaysInMonth(year, month);

  function handleSelect(d) {
    if (d == null) return;
    const date = new Date(year, month, d);
    const str = formatDateForInput(date);
    if (minDate && str < minDate) return;
    if (maxDate && str > maxDate) return;
    onChange(str);
    setOpen(false);
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  const displayLabel = value
    ? (valueDate ? valueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : value)
    : placeholder;

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark text-slate-900 dark:text-white px-3 py-2 text-sm min-w-[140px] justify-between focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow hover:bg-slate-50 dark:hover:bg-surface"
      >
        <span className="text-slate-700 dark:text-white/90">{displayLabel}</span>
        <span className="text-slate-500 dark:text-white/60 shrink-0" aria-hidden="true">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 rounded-2xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface shadow-card dark:shadow-card-dark p-4 min-w-[280px] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-dark-border hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-dark-border hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-white/60 py-1">
                {day}
              </div>
            ))}
            {grid.map((d, i) => {
              if (d == null) {
                return <div key={`e-${i}`} className="py-2" />;
              }
              const dateStr = formatDateForInput(new Date(year, month, d));
              const isSelected = value === dateStr;
              const isDisabled = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate);
              return (
                <button
                  key={`${year}-${month}-${d}`}
                  type="button"
                  onClick={() => handleSelect(d)}
                  disabled={isDisabled}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-500 text-black'
                      : isDisabled
                        ? 'text-slate-400 dark:text-white/30 cursor-not-allowed'
                        : 'text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-border'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
