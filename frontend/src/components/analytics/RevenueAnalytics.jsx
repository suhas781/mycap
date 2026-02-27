/**
 * Revenue Generated analytics page: fetches GET /analytics/revenue, renders KPI cards, charts, table. Orange + Black theme.
 * Used in Admin and Team Lead analytics views.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import RevenueKPICards from './RevenueKPICards';
import RevenueCharts from './RevenueCharts';
import RevenueTable from './RevenueTable';

export default function RevenueAnalytics({ dateFrom, dateTo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const query = params.toString() ? `?${params.toString()}` : '';
    api(`/analytics/revenue${query}`)
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load revenue analytics'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-white/60">
        <span className="inline-block w-8 h-8 border-2 border-[#FF7A00]/30 border-t-[#FF7A00] rounded-full animate-spin" aria-hidden />
        <span className="ml-3">Loading revenue analytics…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border-2 border-red-500/30 bg-[#0E0E0E] p-6 text-red-400" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Revenue Generated</h2>
        <p className="text-sm text-white/50">From converted leads (conversion details). Filter by date range above.</p>
      </div>
      <RevenueKPICards data={data} />
      <RevenueCharts revenueByCourse={data?.revenue_by_course} revenueOverTime={data?.revenue_over_time} />
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Revenue by Course</h3>
        <RevenueTable revenueByCourse={data?.revenue_by_course} />
      </div>
    </div>
  );
}
