/**
 * Date range picker for analytics: select From and To via calendar popovers.
 */
import CalendarPopover from '../CalendarPopover';

export default function DateRangePicker({ from, to, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600 dark:text-white/80">From</span>
        <CalendarPopover
          value={from}
          onChange={(v) => onChange(v, to)}
          maxDate={to || undefined}
          placeholder="Start date"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600 dark:text-white/80">To</span>
        <CalendarPopover
          value={to}
          onChange={(v) => onChange(from, v)}
          minDate={from || undefined}
          placeholder="End date"
        />
      </div>
      {(from || to) && (
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}
