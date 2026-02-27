/**
 * Consistent empty state: icon, title, optional description. Used across tables and panels.
 */
export default function EmptyState({ icon = '📋', title, description, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-surface/30 ${className}`}
    >
      <span className="text-4xl mb-3 opacity-80" aria-hidden="true">
        {icon}
      </span>
      <p className="font-semibold text-slate-700 dark:text-white">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}
