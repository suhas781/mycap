/**
 * FE-only insight rules. No backend.
 * - Percentage: >60 overloaded, 25–60 healthy, <25 low volume.
 * - Name contains "Do Not" or "Upload" → specific insight.
 */
export function getPipelineInsight(pipelineName, percentage) {
  const name = (pipelineName || '').toLowerCase();
  if (name.includes('do not')) return 'Review pitch quality; high rejection rate.';
  if (name.includes('upload')) return 'Follow-up speed might be slow.';
  if (percentage > 60) return 'This pipeline is overloaded — consider redistributing.';
  if (percentage >= 25 && percentage <= 60) return 'Healthy pipeline level.';
  if (percentage < 25) return 'Low volume — BOE follow-up may be slow.';
  return 'Monitor pipeline balance.';
}
