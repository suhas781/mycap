/**
 * BOE Dashboard layout. Leads and Campaigns are separate pages (routes). Header + sidebar + Outlet.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { api, getStoredUser, setToken, setStoredUser } from '../api';
import BOESidebar from '../components/boe/BOESidebar';
import LeadDetailsDrawer from '../components/boe/LeadDetailsDrawer';

export default function BOEDashboard() {
  const [leads, setLeads] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  function loadLeads() {
    setLoading(true);
    api('/leads')
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }

  function loadStatuses() {
    api('/leads/statuses')
      .then(setStatusOptions)
      .catch(() => setStatusOptions([]));
  }

  useEffect(() => {
    loadLeads();
    loadStatuses();
  }, []);

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    navigate('/login', { replace: true });
  }

  function handleSaved() {
    loadLeads();
    setSelectedLead(null);
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-dark">
      <header className="bg-white dark:bg-surface border-b border-slate-200 dark:border-dark-border px-5 py-3.5 flex items-center justify-between shrink-0">
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white">BOE Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 dark:text-white/80">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer text-sm text-slate-600 dark:text-white/70 hover:text-primary-500 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 min-w-0">
        <BOESidebar
          leads={leads}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
        <main className="flex-1 min-w-0 min-h-0 flex flex-col p-4 overflow-hidden">
          <nav className="shrink-0 flex gap-2 mb-3" aria-label="BOE pages">
            <Link
              to="/boe/leads"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${location.pathname === '/boe/leads' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20'}`}
            >
              Leads
            </Link>
            <Link
              to="/boe/campaigns"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${location.pathname === '/boe/campaigns' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20'}`}
            >
              Campaigns
            </Link>
          </nav>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Outlet
              context={{
                leads,
                loading,
                statusOptions,
                activeCategory,
                setActiveCategory,
                selectedLead,
                setSelectedLead,
                loadLeads,
                handleSaved,
              }}
            />
          </div>
        </main>
      </div>

      {selectedLead && (
        <LeadDetailsDrawer
          lead={selectedLead}
          statusOptions={statusOptions}
          onClose={() => setSelectedLead(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
