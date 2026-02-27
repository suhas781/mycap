/**
 * BOE Campaigns page. Add Campaign Details, Add Leads, campaign list.
 */
import BOECampaignList from '../components/campaigns/BOECampaignList';

export default function BOECampaignsPage() {
  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-dark-card rounded-2xl border-2 border-slate-200 dark:border-dark-border overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <BOECampaignList />
      </div>
    </div>
  );
}
