/**
 * PipelineCard — Single pipeline percentage card. Primary accent, clear hierarchy.
 */
export default function PipelineCard({ pipelineName, percentage, count, insight }) {
  return (
    <div className="rounded-2xl border-2 border-dark-border dark:border-primary-500/30 bg-primary-500 p-5 text-black shadow-card-dark dark:shadow-glow-sm min-w-[200px] max-w-[280px] transition-shadow hover:shadow-glow-sm">
      <div className="font-display font-bold text-lg">
        {pipelineName} <span className="opacity-90">({Math.round(percentage)}%)</span>
      </div>
      <div className="mt-1 text-sm font-medium opacity-90">Leads: {count}</div>
      <div className="mt-3 text-sm border-t border-black/20 pt-3">
        <span className="font-semibold">Insight: </span>
        <span className="opacity-95">{insight}</span>
      </div>
    </div>
  );
}
