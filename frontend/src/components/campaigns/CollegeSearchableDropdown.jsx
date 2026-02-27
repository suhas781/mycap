/**
 * BOE: Single searchable dropdown. Filter by college_name and place. Display "College Name — Place". Value = id.
 * Always typeable; opens and focuses on click. Orange/black theme.
 */
import { useState, useRef, useEffect } from 'react';

function displayLabel(c) {
  const name = c.college_name || '';
  const place = c.place?.trim() || '';
  return place ? `${name} — ${place}` : name;
}

export default function CollegeSearchableDropdown({ colleges = [], value, onChange, placeholder = 'Select college', disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? colleges.filter((c) => {
        const q = query.trim().toLowerCase();
        const name = (c.college_name || '').toLowerCase();
        const place = (c.place || '').toLowerCase();
        return name.includes(q) || place.includes(q);
      })
    : colleges;

  const selected = colleges.find((c) => c.id === value);

  // When dropdown opens, focus the input so user can type immediately
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = open ? query : (selected ? displayLabel(selected) : '');

  return (
    <div ref={containerRef} className="relative">
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white px-4 py-3 min-h-[48px] flex items-center justify-between cursor-text transition-all focus-within:border-[#FF7A00] focus-within:ring-2 focus-within:ring-[#FF7A00]/30"
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {}}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-inherit placeholder:text-slate-400 dark:placeholder:text-white/40 text-[15px]"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="college-listbox"
          aria-activedescendant={open && filtered.length ? `college-opt-${filtered[0]?.id}` : undefined}
        />
        <span className="shrink-0 ml-2 text-[#FF7A00] text-sm pointer-events-none" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </div>
      {open && (
        <ul
          id="college-listbox"
          role="listbox"
          className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-xl border-2 border-[#FF7A00]/30 bg-white dark:bg-[#0E0E0E] shadow-xl py-2 ring-2 ring-[#FF7A00]/10"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-slate-500 dark:text-white/50 text-sm">No matches — try another search</li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.id}
                id={`college-opt-${c.id}`}
                role="option"
                aria-selected={value === c.id}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(c.id);
                  setOpen(false);
                  setQuery('');
                }}
                onMouseDown={(e) => e.preventDefault()}
                className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${value === c.id ? 'bg-[#FF7A00]/25 text-[#FF7A00] font-medium' : 'text-slate-800 dark:text-white hover:bg-[#FF7A00]/15 dark:hover:bg-white/10'}`}
              >
                {displayLabel(c)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
