/**
 * CampaignDetailDrawer — Shared: campaign details, assignments, logs.
 * Team Lead: status change, Assign BOEs. BOE: update panel + upload proof.
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import CampaignMultiAssign from './CampaignMultiAssign';
import CampaignUpdatePanel from './CampaignUpdatePanel';
import UploadProofComponent from './UploadProofComponent';

export default function CampaignDetailDrawer({ campaign: initialCampaign, isTeamLead, onClose, onUpdated }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const id = initialCampaign?.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api(`/campaigns/${id}`).then(setCampaign),
      api(`/campaigns/${id}/logs`).then(setLogs).catch(() => []),
    ]).finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus) {
    if (!id || !isTeamLead) return;
    setStatusUpdating(true);
    try {
      const updated = await api(`/campaigns/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setCampaign((c) => (c ? { ...c, status: updated.status } : c));
      onUpdated?.();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  }

  function handleLogAdded() {
    api(`/campaigns/${id}/logs`).then(setLogs).catch(() => {});
    api(`/campaigns/${id}`).then(setCampaign).catch(() => {});
    onUpdated?.();
  }

  if (!initialCampaign) return null;

  const assignments = campaign?.assignments ?? initialCampaign?.assignments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-surface border-l-2 border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-white/5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Campaign details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="inline-block w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 dark:border-dark-border p-4">
                <h3 className="font-semibold text-slate-800 dark:text-white">{campaign?.name ?? initialCampaign.name}</h3>
                {campaign?.description && (
                  <p className="text-sm text-slate-600 dark:text-white/70 mt-1">{campaign.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-white/50">
                  <span>Status: {campaign?.status ?? initialCampaign.status}</span>
                  <span>•</span>
                  <span>{campaign?.start_date ?? '—'} to {campaign?.end_date ?? '—'}</span>
                </div>
                {isTeamLead && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select
                      value={campaign?.status ?? ''}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={statusUpdating}
                      className="rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark text-slate-900 dark:text-white px-3 py-1.5 text-sm"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAssign(true)}
                      className="px-3 py-1.5 rounded-lg bg-primary-500 text-black text-sm font-medium"
                    >
                      Assign BOEs
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2">Assigned BOEs</h4>
                {assignments.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-white/50">No BOEs assigned yet.</p>
                ) : (
                  <ul className="space-y-1 rounded-lg border border-slate-200 dark:border-dark-border divide-y divide-slate-200 dark:divide-dark-border">
                    {assignments.map((a) => (
                      <li key={a.id} className="px-3 py-2 flex justify-between items-center text-sm">
                        <span className="text-slate-700 dark:text-white/90">{a.boe_name ?? `BOE #${a.boe_id}`}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          a.status === 'COMPLETED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                          a.status === 'IN_PROGRESS' ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' :
                          'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/70'
                        }`}>
                          {a.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2">Activity log</h4>
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-white/50">No activity yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-auto">
                    {logs.map((log) => (
                      <li key={log.id} className="text-sm rounded-lg border border-slate-200 dark:border-dark-border p-2">
                        <span className="font-medium text-primary-500">{log.action}</span>
                        {log.notes && <span className="text-slate-600 dark:text-white/70"> — {log.notes}</span>}
                        {log.file_url && (
                          <a href={log.file_url} target="_blank" rel="noopener noreferrer" className="block text-primary-500 hover:underline mt-1">
                            View file
                          </a>
                        )}
                        <span className="block text-xs text-slate-500 dark:text-white/50 mt-1">{log.timestamp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!isTeamLead && (
                <>
                  <CampaignUpdatePanel campaignId={id} onUpdated={handleLogAdded} />
                  <UploadProofComponent campaignId={id} onUploaded={handleLogAdded} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showAssign && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAssign(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CampaignMultiAssign
              campaignId={id}
              initialBoeIds={assignments.map((a) => a.boe_id)}
              onClose={() => setShowAssign(false)}
              onSaved={() => { setShowAssign(false); handleLogAdded(); onUpdated?.(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
