import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, XCircle, ShieldCheck, Database, Loader2 } from 'lucide-react';

export function InvestigationAccordion({
  investigation,
  onTriggerInvestigation,
  isInvestigating = false,
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (!investigation || !investigation.ran) {
    return (
      <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-heading font-semibold text-sm text-[#0B1F33] flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            Manufacturer Official Record Investigation
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Search official manufacturer and regulator repositories for verified unopened shelf life.
          </p>
        </div>

        <button
          type="button"
          disabled={isInvestigating}
          onClick={onTriggerInvestigation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          {isInvestigating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Investigate Manufacturer Info
        </button>
      </div>
    );
  }

  const sources = investigation.sources || [];
  const claims = investigation.claims || [];
  const queries = investigation.queries || [];

  return (
    <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <Search className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#0B1F33]">
              Manufacturer Evidence Investigation
            </h4>
            <span className="text-[11px] text-slate-500">
              Status: {investigation.status} | Credits used: {investigation.creditsUsed || 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          aria-label="Toggle investigation details"
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-3 border-t border-slate-100 text-xs">
          {/* Barcode Identity Lookup Corroboration */}
          {investigation.identityLookup && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800">
                  Barcode Identity Corroboration ({investigation.identityLookup.provider})
                </span>
                <p className="text-slate-600">
                  Confirmed: {investigation.identityLookup.name} ({investigation.identityLookup.brand})
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  {investigation.identityLookup.attribution || 'Open Food Facts contributors (ODbL). Identity corroboration only, never shelf life.'}
                </p>
              </div>
            </div>
          )}

          {/* Search Queries Executed */}
          {queries.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                Deterministic Search Queries:
              </span>
              <div className="space-y-1">
                {queries.map((q, i) => (
                  <div key={i} className="font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources Table */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
              Discovered Web Sources ({sources.length}):
            </span>

            {sources.length === 0 ? (
              <p className="text-slate-500 italic">No search results retrieved.</p>
            ) : (
              <div className="space-y-2">
                {sources.map((src) => {
                  const isEligible = src.eligible;
                  return (
                    <div
                      key={src.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isEligible ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            src.class === 'MANUFACTURER'
                              ? 'bg-blue-100 text-blue-800'
                              : src.class === 'REGULATOR_LABEL'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {src.class}
                          </span>
                          <span className="font-medium text-slate-900 truncate">
                            {src.title || src.domain}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{src.reason}</p>
                      </div>

                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 shrink-0 self-start sm:self-center"
                      >
                        Visit Link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Claims & Anti-Hallucination Quotes */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
              Extracted & Verified Claims ({claims.length}):
            </span>

            {claims.length === 0 ? (
              <p className="text-slate-500 italic">No shelf life claims discovered in retrieved sources.</p>
            ) : (
              <div className="space-y-2">
                {claims.map((claim, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      claim.accepted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold flex items-center gap-1.5">
                        {claim.accepted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                        {claim.accepted ? 'Accepted Claim' : 'Rejected Claim'}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                        Source [{claim.sourceId}]
                      </span>
                    </div>

                    <p className="italic text-slate-800 bg-white/70 p-2 rounded-lg border border-slate-200 my-1 font-serif">
                      "{claim.quote}"
                    </p>

                    {!claim.accepted && claim.rejectReason && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        Rejection reason: {claim.rejectReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
