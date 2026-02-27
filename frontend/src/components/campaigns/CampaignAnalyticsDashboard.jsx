/**
 * Team Lead: Campaign analytics dashboard. GET /analytics/campaigns/team.
 * Orange/black theme. Uses CampaignStatsCards, BOEPerformanceTable, heatmap-style summary.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import CampaignStatsCards from './CampaignStatsCards';
import BOEPerformanceTable from './BOEPerformanceTable';

export default function CampaignAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api('/analytics/campaigns/team')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-white/60">Loading analytics…</p>;
  if (!data) return <p className="text-white/60">Failed to load analytics.</p>;

  return (
    <div className="space-y-6">
      <CampaignStatsCards
        totalCampaigns={data.totalCampaigns}
        campaignsByCity={data.campaignsByCity}
        campaignsByCollege={data.campaignsByCollege}
        campaignsByStream={data.campaignsByStream}
      />
      <div>
        <h3 className="font-display font-semibold text-white mb-3">BOE performance</h3>
        <BOEPerformanceTable boes={data.boes} leadStatusByBoe={data.leadStatusByBoe || []} />
      </div>
      {(data.campaignsByCity?.length > 0 || data.campaignsByCollege?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.campaignsByCity?.length > 0 && (
            <div className="rounded-xl border-2 border-dark-border bg-[#0E0E0E] p-4">
              <h4 className="text-[#FF7A00] font-medium mb-2">Campaigns by City</h4>
              <ul className="space-y-1 text-sm text-white/80">
                {data.campaignsByCity.slice(0, 10).map(({ name, count }) => (
                  <li key={name}>{name}: {count}</li>
                ))}
              </ul>
            </div>
          )}
          {data.campaignsByCollege?.length > 0 && (
            <div className="rounded-xl border-2 border-dark-border bg-[#0E0E0E] p-4">
              <h4 className="text-[#FF7A00] font-medium mb-2">Campaigns by College</h4>
              <ul className="space-y-1 text-sm text-white/80">
                {data.campaignsByCollege.slice(0, 10).map(({ name, count }) => (
                  <li key={name}>{name}: {count}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
