/**
 * ToolSelector — Tab bar for analytics views. Clear active state, scrollable on small screens.
 */
const TOOLS = [
  { id: 'overview', label: 'Overview' },
  { id: 'calendar', label: 'Leads Over Time' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'teamperf', label: 'Team Performance' },
  { id: 'revenue', label: 'Revenue Generated' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'status', label: 'Status' },
  { id: 'boe', label: 'BOE Performance' },
  { id: 'retry', label: 'Retry' },
  { id: 'followup', label: 'Follow-Up Due' },
  { id: 'termination', label: 'Termination' },
  { id: 'funnel', label: 'Funnel' },
];

export default function ToolSelector({ activeTool, onSelect }) {
  return (
    <div className="flex gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-dark-border overflow-x-auto overflow-y-hidden">
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool.id)}
            aria-pressed={isActive}
            aria-label={`View ${tool.label}`}
            className={`shrink-0 cursor-pointer px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary-500 text-white shadow-md ring-2 ring-primary-500/30'
                : 'bg-white dark:bg-surface text-slate-600 dark:text-white/80 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-white/10 hover:border-primary-500/30 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
