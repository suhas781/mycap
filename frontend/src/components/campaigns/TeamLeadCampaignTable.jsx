/**
 * TeamLeadCampaignTable — Team Lead: table of campaigns with assign, edit, status, view.
 * Orange/black theme.
 */
import { useState } from 'react';
import CampaignMultiAssign from './CampaignMultiAssign';
import CampaignDetailDrawer from './CampaignDetailDrawer';

export default function TeamLeadCampaignTable({ campaigns, boes, onRefresh }) {
  const [assignCampaignId, setAssignCampaignId] = useState(null);
  const [detailCampaign, setDetailCampaign] = useState(null);

  const campaignById = campaigns.find((c) => c.id === assignCampaignId);
  const initialBoeIds = campaignById?.assignments?.map((a) => a.boe_id) ?? [];

  return (
    <>
      <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-dark-border">
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-white">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-white">Created by</th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-white">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-white">Dates</th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-white text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-white/90">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-white/50">
                  No campaigns yet. Create one to get started.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  onClick={() => setDetailCampaign(c)}
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.created_by_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                        c.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : c.status === 'CLOSED'
                            ? 'bg-slate-500/20 text-slate-600 dark:text-white/60'
                            : 'bg-primary-500/20 text-primary-600 dark:text-primary-400'
                      }`}
                    >
                      {c.status ?? 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.start_date || c.end_date
                      ? `${c.start_date ?? '—'} to ${c.end_date ?? '—'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setAssignCampaignId(c.id)}
                      className="text-sm font-medium text-primary-500 hover:underline mr-2"
                    >
                      Assign BOEs
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailCampaign(c)}
                      className="text-sm font-medium text-slate-600 dark:text-white/70 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {assignCampaignId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAssignCampaignId(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CampaignMultiAssign
              campaignId={assignCampaignId}
              initialBoeIds={initialBoeIds}
              onClose={() => setAssignCampaignId(null)}
              onSaved={() => { onRefresh?.(); setAssignCampaignId(null); }}
            />
          </div>
        </div>
      )}

      {detailCampaign && (
        <CampaignDetailDrawer
          campaign={detailCampaign}
          isTeamLead
          onClose={() => setDetailCampaign(null)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}
