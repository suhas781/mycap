/**
 * Team Lead: Campaign stats cards (total campaigns, by city/college/stream).
 * Orange/black theme.
 */
export default function CampaignStatsCards({ totalCampaigns, campaignsByCity = [], campaignsByCollege = [], campaignsByStream = [] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-[#FF7A00]/40 bg-[#FF7A00]/10 p-4">
        <p className="text-xs font-medium text-[#FF7A00] uppercase">Total campaigns</p>
        <p className="text-2xl font-bold text-white mt-1">{totalCampaigns ?? 0}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] p-4">
          <p className="text-xs font-medium text-white/50 uppercase">By City</p>
          <p className="text-lg font-bold text-white mt-1">{campaignsByCity.length} cities</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] p-4">
          <p className="text-xs font-medium text-white/50 uppercase">By College</p>
          <p className="text-lg font-bold text-white mt-1">{campaignsByCollege.length} colleges</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] p-4">
          <p className="text-xs font-medium text-white/50 uppercase">By Stream</p>
          <p className="text-lg font-bold text-white mt-1">{campaignsByStream.length} streams</p>
        </div>
      </div>
    </div>
  );
}
