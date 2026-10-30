import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProvenanceChip } from '../ui/ProvenanceChip.jsx';
import { PROVENANCE, EXPIRY_STATE } from '../../../shared/constants.js';
import { formatIsoDate } from '../../lib/format.js';

export function ExpiryCard({ expiry, expiryState, unknownMessage }) {
  const isUnknown = expiry.provenance === PROVENANCE.UNKNOWN || !expiry.iso;

  const getStateBadge = () => {
    switch (expiryState) {
      case EXPIRY_STATE.EXPIRED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      case EXPIRY_STATE.EXPIRING_SOON:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Expiring Within 30 Days
          </span>
        );
      case EXPIRY_STATE.IN_DATE:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            In Date
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="font-heading font-bold text-base text-[#0B1F33]">
            Expiry Assessment
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceChip provenance={expiry.provenance} />
          {getStateBadge()}
        </div>
      </div>

      {isUnknown ? (
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-start gap-3 text-slate-800">
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                {unknownMessage || 'Expiry could not be reliably determined. Please contact the manufacturer or pharmacist.'}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {unknownMessage?.includes('non-perishable')
                  ? 'Computer peripherals, hardware, and durable electronics do not spoil or expire over time. Inspect physical cables and verify warranty coverage with the manufacturer.'
                  : 'In accordance with our Honesty Contract, ExpiryWatch AI never guesses or fabricates expiration dates when packaging or verified records are inconclusive.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold font-heading text-[#0B1F33]">
              {formatIsoDate(expiry.iso)}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              (ISO: {expiry.iso})
            </span>
          </div>

          {expiry.basisText && (
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
              <span className="text-slate-400 font-sans block text-[10px] uppercase font-semibold">
                Basis Evidence:
              </span>
              {expiry.basisText}
            </div>
          )}

          {expiry.formulaText && (
            <div className="text-xs text-indigo-900 bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 space-y-1">
              <span className="text-indigo-600 text-[10px] uppercase font-bold tracking-wider block">
                Deterministic Calculation Formula:
              </span>
              <p className="font-mono text-xs">{expiry.formulaText}</p>
              <p className="text-[11px] text-indigo-700 italic pt-1">
                Calculated, not printed. Conventions differ between manufacturers; verify with the manufacturer.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

