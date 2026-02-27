/**
 * BOE Leads page. Lead table + Add lead drawer (same fields as table: name, phone, email, college; no date).
 */
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import BOELeadTable from '../components/boe/BOELeadTable';
import AddLeadDrawer from '../components/boe/AddLeadDrawer';
import { getFilteredLeads } from '../components/boe/BOESidebar';

export default function BOELeadsPage() {
  const { leads, loading, activeCategory, setSelectedLead, loadLeads } = useOutletContext();
  const [showAddLead, setShowAddLead] = useState(false);
  const filteredLeads = getFilteredLeads(leads || [], activeCategory);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 bg-white dark:bg-dark-card rounded-2xl border-2 border-slate-200 dark:border-dark-border flex items-center justify-center">
        <p className="text-slate-500 dark:text-white/60">Loading leads…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-dark-card rounded-2xl border-2 border-slate-200 dark:border-dark-border overflow-hidden flex flex-col">
      <div className="shrink-0 flex justify-end items-center px-4 py-2 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setShowAddLead(true)}
          title="Add a new lead"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FF7A00] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span className="text-lg leading-none" aria-hidden>+</span>
          <span>Add leads</span>
        </button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <BOELeadTable leads={filteredLeads} onRowClick={setSelectedLead} onRefresh={loadLeads} />
      </div>
      {showAddLead && (
        <AddLeadDrawer
          onClose={() => setShowAddLead(false)}
          onSaved={() => { loadLeads(); setShowAddLead(false); }}
        />
      )}
    </div>
  );
}
