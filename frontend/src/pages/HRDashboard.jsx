/**
 * HR Dashboard — Two sides: (1) Users & roles, (2) Sheets — add sheets and view which sheet is linked to which team lead.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredUser, setToken, setStoredUser } from '../api';
import CampaignAnalytics from '../components/campaigns/CampaignAnalytics';
import TeamWiseCampaignSummary from '../components/campaigns/TeamWiseCampaignSummary';
import BOEPerformanceByCampaign from '../components/campaigns/BOEPerformanceByCampaign';

const ROLES = [
  { value: 'team_lead', label: 'Team Leader' },
  { value: 'boe', label: 'BOE' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' },
];

const EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'notice_period', label: 'Notice period' },
  { value: 'resigned', label: 'Resigned' },
];

const TAB_USERS = 'users';
const TAB_SHEETS = 'sheets';
const TAB_CAMPAIGNS = 'campaigns';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState(TAB_USERS);
  const [users, setUsers] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [savingReportsToId, setSavingReportsToId] = useState(null);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const user = getStoredUser();
  const navigate = useNavigate();

  const teamLeads = users.filter((u) => u.role === 'team_lead');
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetTeamLeadId, setNewSheetTeamLeadId] = useState('');
  const [newSheetId, setNewSheetId] = useState('');
  const [newSheetRange, setNewSheetRange] = useState('');
  const [addingSheet, setAddingSheet] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsWithAssignments, setCampaignsWithAssignments] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  function loadUsers() {
    setLoading(true);
    setError('');
    api('/users')
      .then(setUsers)
      .catch((err) => {
        setError(err.message || 'Failed to load users');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }

  function loadSources() {
    api('/lead-sources')
      .then(setSources)
      .catch(() => setSources([]));
  }

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    loadUsers();
    loadSources();
  }, [navigate]);

  function loadCampaigns() {
    setCampaignsLoading(true);
    api('/campaigns')
      .then((list) => {
        setCampaigns(list || []);
        const ids = (list || []).slice(0, 50).map((c) => c.id);
        if (ids.length === 0) { setCampaignsWithAssignments([]); return; }
        return Promise.all(ids.map((id) => api(`/campaigns/${id}`))).then((d) => setCampaignsWithAssignments(d || []));
      })
      .catch(() => setCampaigns([]))
      .finally(() => setCampaignsLoading(false));
  }

  useEffect(() => {
    if (activeTab === TAB_CAMPAIGNS) loadCampaigns();
  }, [activeTab]);

  async function handleRoleChange(u, newRole) {
    if (u.role === newRole) return;
    setSavingId(u.id);
    setError('');
    try {
      const updated = await api(`/users/${u.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: updated.role, reports_to_id: updated.reports_to_id } : x)));
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  }

  async function handleReportsToChange(u, teamLeadId) {
    const value = teamLeadId === '' ? null : Number(teamLeadId);
    if (u.reports_to_id === value) return;
    setSavingReportsToId(u.id);
    setError('');
    try {
      const updated = await api(`/users/${u.id}/reports-to`, {
        method: 'PUT',
        body: JSON.stringify({ team_lead_id: value }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, reports_to_id: updated.reports_to_id } : x)));
    } catch (err) {
      setError(err.message || 'Failed to assign team lead');
    } finally {
      setSavingReportsToId(null);
    }
  }

  async function handleEmploymentStatusChange(u, status) {
    const value = status || 'active';
    if ((u.employment_status || 'active') === value) return;
    setSavingStatusId(u.id);
    setError('');
    try {
      const updated = await api(`/users/${u.id}/employment-status`, {
        method: 'PUT',
        body: JSON.stringify({ employment_status: value }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, employment_status: updated.employment_status } : x)));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setSavingStatusId(null);
    }
  }

  async function handleDeleteUser(u) {
    if (u.id === user?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    setDeletingId(u.id);
    setError('');
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRemoveAllExceptMe() {
    const otherCount = users.filter((u) => u.id !== user?.id).length;
    if (otherCount === 0) {
      setError('There are no other users to remove.');
      return;
    }
    if (!window.confirm(`Remove all ${otherCount} other user(s)? You will remain the only user. This cannot be undone.`)) return;
    setRemovingAll(true);
    setError('');
    try {
      const result = await api('/users/remove-all-except-me', { method: 'POST' });
      setUsers(users.filter((u) => u.id === user?.id));
      if (result.removed != null) {
        setRemoveSuccess(`Removed ${result.removed} user(s). You are now the only user.`);
        setTimeout(() => setRemoveSuccess(''), 6000);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove users');
    } finally {
      setRemovingAll(false);
    }
  }

  async function handleAddSheet(e) {
    e.preventDefault();
    if (!newSheetName.trim() || !newSheetTeamLeadId || !newSheetId.trim()) return;
    setAddingSheet(true);
    setError('');
    try {
      await api('/lead-sources', {
        method: 'POST',
        body: JSON.stringify({
          name: newSheetName.trim(),
          team_lead_id: Number(newSheetTeamLeadId),
          google_sheet_id: newSheetId.trim(),
          sheet_range: newSheetRange.trim() || undefined,
        }),
      });
      setNewSheetName('');
      setNewSheetTeamLeadId('');
      setNewSheetId('');
      setNewSheetRange('');
      loadSources();
    } catch (err) {
      setError(err.message || 'Failed to add sheet');
    } finally {
      setAddingSheet(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-dark">
      <header className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-dark-border bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-lg font-bold text-primary-500">HR</h1>
          <nav className="flex gap-1 rounded-xl bg-dark p-0.5">
            <button
              type="button"
              onClick={() => { setActiveTab(TAB_USERS); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === TAB_USERS ? 'bg-primary-500 text-black' : 'text-white/70 hover:text-white hover:bg-surface'}`}
            >
              Users & roles
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab(TAB_SHEETS); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === TAB_SHEETS ? 'bg-primary-500 text-black' : 'text-white/70 hover:text-white hover:bg-surface'}`}
            >
              Sheets
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab(TAB_CAMPAIGNS); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === TAB_CAMPAIGNS ? 'bg-primary-500 text-black' : 'text-white/70 hover:text-white hover:bg-surface'}`}
            >
              Campaign analytics
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer text-sm text-white/70 hover:text-primary-500 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-200 text-sm" role="alert">
            {error}
          </div>
        )}
        {removeSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-700 text-green-200 text-sm" role="status">
            {removeSuccess}
          </div>
        )}

        {activeTab === TAB_USERS && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <p className="text-white/70 text-sm">
                Assign roles and assign each BOE to a team leader. Each team leader only sees their assigned BOEs.
              </p>
              {users.filter((u) => u.id !== user?.id).length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveAllExceptMe}
                  disabled={removingAll}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {removingAll ? 'Removing…' : 'Remove all except me'}
                </button>
              )}
            </div>
            {loading ? (
              <p className="text-white/80">Loading users…</p>
            ) : (
              <div className="rounded-lg border-2 border-[#0E0E0E] bg-[#1A1A1A] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#FF7A00] text-black">
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold w-48">Change role</th>
                      <th className="px-4 py-3 font-semibold w-52">Reports to (Team Lead)</th>
                      <th className="px-4 py-3 font-semibold w-44">Status</th>
                      <th className="px-4 py-3 font-semibold w-20">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-[#2A2A2A] hover:bg-[#2A2A2A]">
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2">{u.email}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#FF7A00]/20 text-[#FF7A00]">
                            {ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            disabled={savingId === u.id}
                            className="w-full rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          {savingId === u.id && <span className="text-xs text-white/60 ml-1">Saving…</span>}
                        </td>
                        <td className="px-4 py-2">
                          {u.role === 'boe' ? (
                            <>
                              <select
                                value={u.reports_to_id ?? ''}
                                onChange={(e) => handleReportsToChange(u, e.target.value)}
                                disabled={savingReportsToId === u.id}
                                className="w-full rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                              >
                                <option value="">— Unassigned —</option>
                                {teamLeads.map((tl) => (
                                  <option key={tl.id} value={tl.id}>{tl.name}</option>
                                ))}
                              </select>
                              {savingReportsToId === u.id && <span className="text-xs text-white/60 ml-1">Saving…</span>}
                            </>
                          ) : (
                            <span className="text-white/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={u.employment_status || 'active'}
                            onChange={(e) => handleEmploymentStatusChange(u, e.target.value)}
                            disabled={savingStatusId === u.id}
                            className="w-full rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                          >
                            {EMPLOYMENT_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          {savingStatusId === u.id && <span className="text-xs text-white/60 ml-1">Saving…</span>}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === user?.id || deletingId === u.id}
                            className="rounded px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title={u.id === user?.id ? 'Cannot delete yourself' : 'Delete user'}
                          >
                            {deletingId === u.id ? '…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="p-6 text-white/80 text-center">No users found.</p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === TAB_SHEETS && (
          <>
            <p className="text-white/70 text-sm mb-4">
              Add Google Sheets and see which sheet is linked to which team lead.
            </p>
            <div className="mb-6 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <h2 className="text-[#FF7A00] font-medium mb-3">Add new sheet</h2>
              <form onSubmit={handleAddSheet} className="grid gap-3 max-w-md">
                <input
                  type="text"
                  placeholder="Sheet name (e.g. Region A)"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  className="rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-2 text-sm"
                />
                <select
                  value={newSheetTeamLeadId}
                  onChange={(e) => setNewSheetTeamLeadId(e.target.value)}
                  required
                  className="rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-2 text-sm"
                >
                  <option value="">Select team leader</option>
                  {teamLeads.map((tl) => (
                    <option key={tl.id} value={tl.id}>{tl.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Google Sheet ID (from URL)"
                  value={newSheetId}
                  onChange={(e) => setNewSheetId(e.target.value)}
                  className="rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Sheet range (optional, e.g. Sheet1)"
                  value={newSheetRange}
                  onChange={(e) => setNewSheetRange(e.target.value)}
                  className="rounded border border-[#2A2A2A] bg-[#0E0E0E] text-white px-3 py-2 text-sm"
                />
                <button type="submit" disabled={addingSheet} className="cursor-pointer px-3 py-2 rounded bg-[#FF7A00] text-black text-sm font-semibold w-fit">
                  {addingSheet ? 'Adding…' : 'Add sheet'}
                </button>
              </form>
            </div>
            <h2 className="text-[#FF7A00] font-medium mb-3">Sheets linked to team leads</h2>
            <div className="rounded-lg border-2 border-[#0E0E0E] bg-[#1A1A1A] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FF7A00] text-black">
                    <th className="px-4 py-3 font-semibold">Sheet name</th>
                    <th className="px-4 py-3 font-semibold">Team lead</th>
                    <th className="px-4 py-3 font-semibold">Google Sheet ID</th>
                    <th className="px-4 py-3 font-semibold">Range</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {sources.map((s) => (
                    <tr key={s.id} className="border-t border-[#2A2A2A] hover:bg-[#2A2A2A]">
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{s.team_lead_name ?? '—'}</td>
                      <td className="px-4 py-2 font-mono text-xs text-white/80 truncate max-w-[12rem]" title={s.google_sheet_id}>{s.google_sheet_id || '—'}</td>
                      <td className="px-4 py-2 text-white/80">{s.sheet_range || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sources.length === 0 && (
                <p className="p-6 text-white/80 text-center">No sheets yet. Add one above.</p>
              )}
            </div>
          </>
        )}

        {activeTab === TAB_CAMPAIGNS && (
          <div className="space-y-6">
            <p className="text-white/70 text-sm">Read-only campaign analytics.</p>
            {campaignsLoading ? (
              <p className="text-white/80">Loading campaign data…</p>
            ) : (
              <>
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <TeamWiseCampaignSummary campaigns={campaigns} />
                  <BOEPerformanceByCampaign campaignsWithAssignments={campaignsWithAssignments} />
                </section>
                <section>
                  <CampaignAnalytics campaigns={campaigns} />
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
