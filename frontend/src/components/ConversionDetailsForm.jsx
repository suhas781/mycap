/**
 * Form fields for conversion details: course_name (select from team lead courses or type), course_fee, amount_paid, due_amount.
 * When leadId is provided, fetches courses for that lead's team and shows dropdown. Orange/black theme.
 */
import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function ConversionDetailsForm({ leadId, onSubmit, onCancel, disabled }) {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(!!leadId);
  const [courseName, setCourseName] = useState('');
  const [courseOpen, setCourseOpen] = useState(false);
  const courseRef = useRef(null);
  const [courseFee, setCourseFee] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (courseRef.current && !courseRef.current.contains(e.target)) setCourseOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const feeNum = parseFloat(courseFee) || 0;
  const paidNum = amountPaid === '' ? 0 : parseFloat(amountPaid) || 0;
  const dueComputed = Math.max(0, feeNum - paidNum);

  useEffect(() => {
    if (!leadId) return;
    setCoursesLoading(true);
    api(`/courses?for_lead_id=${encodeURIComponent(leadId)}`)
      .then((list) => setCourses(Array.isArray(list) ? list : []))
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [leadId]);

  useEffect(() => {
    if (dueAmount === '' || dueAmount === undefined) return;
    const d = parseFloat(dueAmount);
    if (!Number.isNaN(d)) setDueAmount(String(d));
  }, []);

  const displayDue = dueAmount !== '' && dueAmount !== undefined ? dueAmount : (dueComputed >= 0 ? String(dueComputed) : '');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const fee = courseFee === '' ? null : parseFloat(courseFee);
    const paid = amountPaid === '' ? 0 : parseFloat(amountPaid) || 0;
    const due = dueAmount !== '' && dueAmount !== undefined ? parseFloat(dueAmount) : dueComputed;

    const nameEmpty = !courseName.trim();
    if (courses.length > 0 && nameEmpty) {
      setError('Please select a course');
      return;
    }
    if (nameEmpty && (courseFee === '' || Number.isNaN(parseFloat(courseFee))) && (amountPaid === '' || parseFloat(amountPaid) === 0)) {
      setError('At least one field is required (e.g. course name and course fee)');
      return;
    }
    if (fee == null || Number.isNaN(fee)) {
      setError('Course fee is required');
      return;
    }
    if (fee < 0) {
      setError('Course fee must be >= 0');
      return;
    }
    if (paid < 0) {
      setError('Amount paid must be >= 0');
      return;
    }
    if (paid > fee) {
      setError('Amount paid cannot exceed course fee');
      return;
    }
    if (due < 0) {
      setError('Due amount cannot be negative');
      return;
    }

    const finalDue = Number.isNaN(due) ? dueComputed : due;
    if (finalDue < 0) {
      setError('Due amount cannot be negative');
      return;
    }

    onSubmit({
      course_name: courseName.trim() || null,
      course_fee: fee,
      amount_paid: paid,
      due_amount: finalDue,
    });
  }

  const inputCls = 'w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none [color-scheme:dark]';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-1">
          Course <span className="text-white/50 font-normal">(select from your Team Lead’s courses)</span>
        </label>
        {coursesLoading ? (
          <p className="text-sm text-white/50 py-2">Loading courses…</p>
        ) : courses.length > 0 ? (
          <div className="relative" ref={courseRef}>
            <button
              type="button"
              onClick={() => !disabled && setCourseOpen((o) => !o)}
              disabled={disabled}
              className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}
              aria-haspopup="listbox"
              aria-expanded={courseOpen}
            >
              <span className={courseName ? 'text-white' : 'text-white/40'}>{courseName || '— Select course —'}</span>
              <svg className={`w-5 h-5 text-white/60 shrink-0 transition-transform ${courseOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {courseOpen && (
              <ul
                className="absolute z-50 w-full mt-1 py-1 rounded-xl border-2 border-[#FF7A00]/40 bg-[#0E0E0E] shadow-xl max-h-56 overflow-auto"
                role="listbox"
              >
                <li>
                  <button
                    type="button"
                    onClick={() => { setCourseName(''); setCourseOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${!courseName ? 'bg-[#FF7A00]/30 text-black font-medium' : 'text-white/90 hover:bg-[#FF7A00]/20 hover:text-white'}`}
                    role="option"
                  >
                    — Select course —
                  </button>
                </li>
                {courses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => { setCourseName(c.name); setCourseOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${courseName === c.name ? 'bg-[#FF7A00]/30 text-black font-medium' : 'text-white/90 hover:bg-[#FF7A00]/20 hover:text-white'}`}
                      role="option"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className={inputCls}
              placeholder="No courses from Team Lead yet – type name or ask them to add in Courses"
              disabled={disabled}
            />
            <p className="text-xs text-white/50 mt-1">Your Team Lead can add courses in the sidebar → Courses.</p>
          </>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-1">Course Fee *</label>
        <input
          type="number"
          min="0"
          step="any"
          value={courseFee}
          onChange={(e) => setCourseFee(e.target.value)}
          className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none [color-scheme:dark]"
          placeholder="0"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-1">Amount Paid</label>
        <input
          type="number"
          min="0"
          step="any"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none [color-scheme:dark]"
          placeholder="0 (if empty treated as 0)"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-1">Due Amount</label>
        <input
          type="number"
          min="0"
          step="any"
          value={displayDue}
          onChange={(e) => setDueAmount(e.target.value)}
          className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none [color-scheme:dark]"
          placeholder="Auto: course fee − amount paid"
          disabled={disabled}
        />
        {dueAmount === '' && (feeNum > 0 || paidNum > 0) && (
          <p className="text-xs text-white/50 mt-1">Auto-calculated: {dueComputed}</p>
        )}
      </div>
      {error && <p className="text-sm text-red-400 font-medium" role="alert">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="px-6 py-3 rounded-xl border-2 border-white/20 text-white/80 font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="px-6 py-3 rounded-xl bg-[#FF7A00] text-black font-bold hover:opacity-95 disabled:opacity-50 shadow-lg shadow-[#FF7A00]/20"
        >
          Submit Conversion Details
        </button>
      </div>
    </form>
  );
}
