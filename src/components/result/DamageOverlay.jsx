import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

export function DamageOverlay({ images = [], findings = [] }) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showOverlays, setShowOverlays] = useState(true);

  if (!images || images.length === 0) return null;

  const currentImg = images[selectedImageIdx] || images[0];
  const currentFindings = findings.filter((f) => f.imageIndex === selectedImageIdx);

  return (
    <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="font-heading font-semibold text-sm text-[#0B1F33] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Packaging Inspection & Defect Evidence
        </h4>

        <button
          type="button"
          onClick={() => setShowOverlays(!showOverlays)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors self-start"
        >
          {showOverlays ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showOverlays ? 'Hide Defect Boxes' : 'Show Defect Boxes'}
        </button>
      </div>

      {/* Image selector tabs */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedImageIdx === idx
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Photo #{idx + 1} ({img.role})
            </button>
          ))}
        </div>
      )}

      {/* Display with Bounding Boxes */}
      <div className="relative aspect-4/3 max-w-xl mx-auto rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <img
          src={currentImg.dataUrl}
          alt={`Inspected image ${selectedImageIdx + 1}`}
          className="w-full h-full object-contain"
        />

        {showOverlays &&
          currentFindings.map((finding, fIdx) => {
            if (!finding.box2d) return null;
            const [ymin, xmin, ymax, xmax] = finding.box2d;
            const top = `${(ymin / 1000) * 100}%`;
            const left = `${(xmin / 1000) * 100}%`;
            const height = `${((ymax - ymin) / 1000) * 100}%`;
            const width = `${((xmax - xmin) / 1000) * 100}%`;

            const isSevere = finding.severity === 'severe';

            return (
              <div
                key={fIdx}
                style={{ top, left, width, height }}
                className={`absolute border-2 pointer-events-auto transition-all ${
                  isSevere ? 'border-rose-500 bg-rose-500/20' : 'border-amber-500 bg-amber-500/20'
                }`}
              >
                <span
                  className={`absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase rounded shadow-xs ${
                    isSevere ? 'bg-rose-600' : 'bg-amber-600'
                  }`}
                >
                  {finding.type.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
      </div>

      {/* Findings details list */}
      <div className="space-y-2 pt-2">
        {findings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No visible packaging defects detected.</p>
        ) : (
          findings.map((f, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                f.severity === 'severe'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  f.severity === 'severe' ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <div className="space-y-0.5">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  {f.type.replace(/_/g, ' ')} ({f.severity} severity)
                </span>
                <p className="leading-relaxed">{f.evidence}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
