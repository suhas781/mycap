/**
 * PipelinePercentagePanel — Pipeline % with donut chart + cards. Date range supported.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import PipelineCard from './PipelineCard';
import PipelineDonutChart from './PipelineDonutChart';
import { getPipelineInsight } from './pipelineInsights';

export default function PipelinePercentagePanel({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`)
      .then(setLeads)
      .catch((err) => setError(err.message || 'Failed to load leads'))
      .finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-surface rounded-xl border-2 border-slate-200 dark:border-dark-border text-slate-600 dark:text-white text-center shadow-card dark:shadow-card-dark">
        Loading leads…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-surface rounded-xl border-2 border-slate-200 dark:border-dark-border text-primary-500 shadow-card dark:shadow-card-dark" role="alert">
        {error}
      </div>
    );
  }

  const total = leads.length;
  const byPipeline = leads.reduce((acc, lead) => {
    const p = lead.pipeline || 'Unknown';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const cards = Object.entries(byPipeline).map(([name, count]) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const insight = getPipelineInsight(name, percentage);
    return { pipelineName: name, count, percentage, insight };
  });
  const chartData = Object.entries(byPipeline);

  return (
    <div className="space-y-6">
      {chartData.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
          <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Pipeline mix</h3>
          <PipelineDonutChart data={chartData} height={260} />
        </div>
      )}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <PipelineCard
          key={card.pipelineName}
          pipelineName={card.pipelineName}
          percentage={card.percentage}
          count={card.count}
          insight={card.insight}
        />
      ))}
      {cards.length === 0 && (
        <p className="col-span-full text-slate-500 dark:text-white/80 text-center py-8">No pipeline data from leads.</p>
      )}
    </div>
    </div>
  );
}
