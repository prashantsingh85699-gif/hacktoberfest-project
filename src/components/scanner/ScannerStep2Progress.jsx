import React from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const STAGES = [
  { id: 'prep', label: 'Preparing & normalizing images' },
  { id: 'ocr_init', label: 'Loading client OCR engine' },
  { id: 'ocr_read', label: 'Extracting printed text & candidate stamps' },
  { id: 'barcode', label: 'Decoding retail barcodes' },
  { id: 'vision', label: 'Gemini vision label & damage inspection' },
];

export function ScannerStep2Progress({ currentStage, onCancel }) {
  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="bg-white border border-[#E5E7EF] rounded-2xl p-8 max-w-lg mx-auto shadow-sm text-center space-y-6">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div>
        <h3 className="font-heading font-bold text-lg text-[#0B1F33]">
          Inspecting Packaging
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Running dual OCR verification and vision analysis.
        </p>
      </div>

      {/* Progress steps */}
      <div className="space-y-3 text-left max-w-sm mx-auto">
        {STAGES.map((stage, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;

          return (
            <div key={stage.id} className="flex items-center gap-3 text-sm">
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
              )}
              <span
                className={`${
                  isDone
                    ? 'text-slate-700 font-medium'
                    : isCurrent
                    ? 'text-indigo-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors"
        >
          <XCircle className="w-4 h-4 text-slate-400" />
          Cancel Inspection
        </button>
      </div>
    </div>
  );
}
