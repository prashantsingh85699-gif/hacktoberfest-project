import React from 'react';
import { AlertCircle, AlertOctagon, CheckCircle2, Shield } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '../../../shared/constants.js';

export function RecommendationsCard({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h3 className="font-heading font-bold text-base text-[#0B1F33]">
          Recommendations & Safety Guidance
        </h3>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          {recommendation.headline}
        </h4>

        {recommendation.details && recommendation.details.length > 0 && (
          <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
            {recommendation.details.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {recommendation.doNot && recommendation.doNot.length > 0 && (
          <div className="pt-2 border-t border-slate-200/60 space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Precautions / Do Not:
            </span>
            <ul className="space-y-1 text-xs text-rose-900 pl-1">
              {recommendation.doNot.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center italic">
        {recommendation.disclaimer || SAFETY_DISCLAIMER}
      </p>
    </div>
  );
}
