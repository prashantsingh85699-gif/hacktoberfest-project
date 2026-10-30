import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { PROVENANCE } from '../../../shared/constants.js';

const PROVENANCE_INFO = {
  [PROVENANCE.PRINTED]: {
    label: 'PRINTED ON PACK',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    description: 'Directly printed date (EXP / Best Before / Use By) read from packaging and verified by OCR and AI agreement.',
  },
  [PROVENANCE.LABEL_RULE]: {
    label: 'LABEL RULE',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    description: 'Computed deterministically in code from a printed packaging rule (e.g. "Best before 9 months from manufacture") and confirmed MFG date.',
  },
  [PROVENANCE.MANUFACTURER_CONFIRMED]: {
    label: 'MANUFACTURER CONFIRMED',
    color: 'bg-blue-50 text-blue-800 border-blue-300',
    description: 'Specific batch expiration confirmed directly from official manufacturer or regulator documentation matching this exact batch code.',
  },
  [PROVENANCE.CALCULATED]: {
    label: 'CALCULATED',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    description: 'Calculated deterministically in code from a confirmed MFG date and an accepted verbatim manufacturer shelf-life claim.',
  },
  [PROVENANCE.UNKNOWN]: {
    label: 'UNKNOWN',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'No verified printed date, rule, or manufacturer claim could be established. No speculative date will ever be invented.',
  },
};

export function ProvenanceChip({ provenance }) {
  const [showPopover, setShowPopover] = useState(false);
  const info = PROVENANCE_INFO[provenance] || PROVENANCE_INFO[PROVENANCE.UNKNOWN];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold tracking-wide transition-colors ${info.color} cursor-help`}
        aria-label={`Provenance: ${info.label}`}
      >
        <span>PROVENANCE:</span>
        <span>{info.label}</span>
        <Info className="w-3.5 h-3.5 opacity-70" />
      </button>

      {showPopover && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-lg border border-slate-800 pointer-events-none">
          <p className="font-semibold text-slate-100 mb-1">{info.label}</p>
          <p className="text-slate-300 leading-relaxed">{info.description}</p>
          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
