import React, { useState, useMemo } from 'react';
import { Check, AlertCircle, Edit3, CheckCircle2 } from 'lucide-react';
import { assess } from '../../../shared/assess.js';
import { StatusBadge } from '../ui/StatusBadge.jsx';

export function ScannerStep3Confirm({
  extraction,
  onConfirmFinal,
}) {
  const [productOverrides, setProductOverrides] = useState({
    name: extraction.product?.name || '',
    brand: extraction.product?.brand || '',
    category: extraction.product?.category || 'food',
  });

  const [dateOverrides, setDateOverrides] = useState(
    (extraction.dates || []).map((d) => ({
      kind: d.kind,
      rawText: d.rawText,
      iso: d.parsed?.iso || '',
      ambiguous: d.parsed?.ambiguous || false,
      selectedCandidate: d.parsed?.iso || '',
      confirmedByUser: d.agreement === 'both' && !d.parsed?.ambiguous,
    }))
  );

  const [paoMonths, setPaoMonths] = useState(extraction.pao?.months || '');
  const [openedOn, setOpenedOn] = useState('');

  // Live Re-assessment
  const liveAssessment = useMemo(() => {
    const updatedDates = (extraction.dates || []).map((orig, i) => {
      const ov = dateOverrides[i] || {};
      const chosenIso = ov.selectedCandidate || ov.iso;
      return {
        ...orig,
        kind: ov.kind,
        confirmedByUser: ov.confirmedByUser,
        parsed: chosenIso
          ? {
              iso: chosenIso,
              precision: orig.parsed?.precision || 'day',
              ambiguous: false,
            }
          : null,
      };
    });

    return assess({
      extraction: {
        ...extraction,
        product: { ...extraction.product, ...productOverrides },
        dates: updatedDates,
        pao: {
          present: !!paoMonths,
          months: paoMonths ? parseInt(paoMonths, 10) : null,
        },
      },
      investigation: null,
      userOverrides: {
        openedOn: openedOn || null,
      },
    });
  }, [extraction, productOverrides, dateOverrides, paoMonths, openedOn]);

  const updateDateField = (index, field, value) => {
    const updated = [...dateOverrides];
    updated[index] = { ...updated[index], [field]: value };
    setDateOverrides(updated);
  };

  const confirmAll = () => {
    setDateOverrides(
      dateOverrides.map((d) => ({
        ...d,
        confirmedByUser: true,
      }))
    );
  };

  const handleFinalSubmit = () => {
    const finalDates = (extraction.dates || []).map((orig, i) => {
      const ov = dateOverrides[i] || {};
      const chosenIso = ov.selectedCandidate || ov.iso;
      return {
        ...orig,
        kind: ov.kind,
        confirmedByUser: ov.confirmedByUser,
        parsed: chosenIso
          ? {
              iso: chosenIso,
              precision: orig.parsed?.precision || 'day',
              ambiguous: false,
            }
          : null,
      };
    });

    onConfirmFinal({
      product: { ...extraction.product, ...productOverrides },
      dates: finalDates,
      pao: {
        present: !!paoMonths,
        months: paoMonths ? parseInt(paoMonths, 10) : null,
      },
      openedOn: openedOn || null,
      assessment: liveAssessment,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Live Status Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
            Live Recomputed Status
          </span>
          <StatusBadge status={liveAssessment.primaryStatus} size="lg" />
        </div>
        <button
          type="button"
          onClick={confirmAll}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors self-stretch sm:self-auto min-h-[44px]"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          Confirm All Extracted Fields
        </button>
      </div>

      {/* Product Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="font-heading font-bold text-sm text-[#0B1F33] flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-indigo-600" />
          Product Identification
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              value={productOverrides.name}
              onChange={(e) => setProductOverrides({ ...productOverrides, name: e.target.value })}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
            <input
              type="text"
              value={productOverrides.brand}
              onChange={(e) => setProductOverrides({ ...productOverrides, brand: e.target.value })}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={productOverrides.category}
              onChange={(e) => setProductOverrides({ ...productOverrides, category: e.target.value })}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="food">Food & Beverage</option>
              <option value="medicine">Medicine / Pharma</option>
              <option value="cosmetic">Cosmetics & Personal Care</option>
              <option value="electronics">Electronics / Hardware</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Extracted Dates Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className="font-heading font-bold text-sm text-[#0B1F33]">
            Detected Dates & Stamps ({dateOverrides.length})
          </h4>
          <span className="text-xs text-slate-500">
            Reconcile OCR and AI reads
          </span>
        </div>

        {dateOverrides.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            No printed dates detected on the uploaded packaging photos.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dateOverrides.map((dateItem, idx) => {
              const origDate = extraction.dates[idx] || {};
              const isAmbiguous = origDate.parsed?.ambiguous;
              const candidates = origDate.parsed?.candidatesIfAmbiguous || [];

              return (
                <div key={idx} className="py-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={dateItem.kind}
                        onChange={(e) => updateDateField(idx, 'kind', e.target.value)}
                        className="text-xs font-bold uppercase bg-slate-100 border border-slate-300 rounded-lg p-1.5"
                      >
                        <option value="EXP">EXP (Expiry)</option>
                        <option value="MFG">MFG (Manufactured)</option>
                        <option value="BEST_BEFORE">Best Before</option>
                        <option value="USE_BY">Use By</option>
                        <option value="OTHER">Other Stamp</option>
                      </select>

                      <span className="font-mono text-xs font-semibold bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800">
                        {dateItem.rawText}
                      </span>

                      {/* Agreement Badge */}
                      {origDate.agreement === 'both' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          OCR + AI Agree
                        </span>
                      )}
                      {origDate.agreement === 'single_ai' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                          AI vision read
                        </span>
                      )}
                      {origDate.agreement === 'conflict' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Conflict
                        </span>
                      )}
                    </div>

                    {/* Confirmation Checkbox */}
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer self-start sm:self-center">
                      <input
                        type="checkbox"
                        checked={dateItem.confirmedByUser}
                        onChange={(e) => updateDateField(idx, 'confirmedByUser', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Confirm Value</span>
                    </label>
                  </div>

                  {/* Ambiguous Date Picker */}
                  {isAmbiguous && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        Ambiguous Date: Please select Day/Month order:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {candidates.map((cand, cIdx) => (
                          <label
                            key={cIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                              dateItem.selectedCandidate === cand.iso
                                ? 'bg-amber-100 border-amber-400 font-bold text-amber-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`candidate_${idx}`}
                              checked={dateItem.selectedCandidate === cand.iso}
                              onChange={() => updateDateField(idx, 'selectedCandidate', cand.iso)}
                              className="text-amber-600"
                            />
                            <span>{cand.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cosmetic PAO Card */}
      {productOverrides.category === 'cosmetic' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="font-heading font-bold text-sm text-[#0B1F33]">
            Cosmetic Period After Opening (PAO)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAO Months (e.g. 12M symbol)
              </label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={paoMonths}
                onChange={(e) => setPaoMonths(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date First Opened (if opened)
              </label>
              <input
                type="date"
                value={openedOn}
                onChange={(e) => setOpenedOn(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Proceed Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleFinalSubmit}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md hover:shadow-xl transition-all active:scale-[0.98] min-h-[52px]"
        >
          View Verified Inspection Findings
        </button>
      </div>
    </div>
  );
}
