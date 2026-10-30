import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, ShieldCheck, Search, CheckCircle2, AlertOctagon, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ProvenanceChip } from '../components/ui/ProvenanceChip.jsx';
import { PRIMARY_STATUS, PROVENANCE } from '../../shared/constants.js';

export function Home() {
  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6 pt-2 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-semibold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          The Honesty Contract: Zero hallucinated dates. Real verification only.
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B1F33] tracking-tight leading-[1.15]">
          Inspect product packaging <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800 bg-clip-text text-transparent">
            with honest AI vision.
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Smart inspector for food, medicine, and cosmetics. Accurately identifies non-perishable goods (like computer hardware), detects physical packaging defects, and verifies manufacturer records.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-2 max-w-md mx-auto">
          <Link
            to="/scan"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95 min-h-[48px]"
          >
            <Camera className="w-5 h-5" />
            Inspect a Product Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            to="/how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-semibold text-sm transition-colors min-h-[48px] shadow-xs"
          >
            Truth Ladder & Rules
          </Link>
        </div>
      </section>

      {/* Example Result Card (Clearly labelled Example) */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Interactive Output Preview (Example)
          </span>
        </div>

        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-medium">Cosmetic • Radiance Booster Serum</span>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                DemoBrand Hydra-Glow Serum 30ml
              </h3>
            </div>
            <StatusBadge status={PRIMARY_STATUS.ESTIMATED_VERIFIED_INPUTS} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Calculated Expiry Date
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#0B1F33]">14/01/2028</span>
                <ProvenanceChip provenance={PROVENANCE.CALCULATED} />
              </div>
              <p className="text-[11px] font-mono text-slate-600">
                MFG 15/01/2026 + 24 months - 1 day = 14/01/2028
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Verified Manufacturer Claim
              </span>
              <p className="text-xs italic text-slate-800">
                "unopened shelf life is 24 months from manufacture date"
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                ✓ Verified substring from demobrand.com
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Pipeline */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
            How ExpiryWatch Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            A 4-step pipeline designed with strict anti-hallucination verification gates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Photograph',
              desc: 'Upload up to 5 photos: front, back, bottom, and stamped batch/EXP area.',
            },
            {
              step: '02',
              title: 'Read & Reconcile',
              desc: 'In-browser OCR worker + Gemini vision extract printed dates and validate agreement.',
            },
            {
              step: '03',
              title: 'Confirm Fields',
              desc: 'Resolve any ambiguous formats (DMY vs MDY) and inspect live deterministic rules.',
            },
            {
              step: '04',
              title: 'Investigate',
              desc: 'If missing, query verified manufacturer pages for exact shelf-life claims.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-white border border-[#E5E7EF] rounded-xl p-5 shadow-xs space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {item.step}
              </span>
              <h3 className="font-heading font-bold text-base text-[#0B1F33] pt-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Never Do (The Honesty Panel) */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-rose-800">
            <AlertOctagon className="w-6 h-6 shrink-0" />
            <h3 className="font-heading font-bold text-lg">
              The Anti-Hallucination Contract: What We Never Do
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-rose-950">
            <div className="space-y-1 bg-white/70 p-3.5 rounded-xl border border-rose-100">
              <span className="font-bold block text-rose-900">Never Invent Dates</span>
              <p className="text-slate-600">
                LLMs never output date calculations. All date arithmetic and formatting are handled by deterministic TypeScript/JS logic.
              </p>
            </div>

            <div className="space-y-1 bg-white/70 p-3.5 rounded-xl border border-rose-100">
              <span className="font-bold block text-rose-900">Never Say "Safe to Use"</span>
              <p className="text-slate-600">
                We state: "No expiry problem found on the printed date. This does not guarantee safety." Packaging integrity does not guarantee chemical purity.
              </p>
            </div>

            <div className="space-y-1 bg-white/70 p-3.5 rounded-xl border border-rose-100">
              <span className="font-bold block text-rose-900">No Generic Shelf-Life Guessing</span>
              <p className="text-slate-600">
                Calculations require a verified verbatim claim from an official manufacturer or regulator source matching the exact product.
              </p>
            </div>

            <div className="space-y-1 bg-white/70 p-3.5 rounded-xl border border-rose-100">
              <span className="font-bold block text-rose-900">No Medicine Guesses</span>
              <p className="text-slate-600">
                Medicines with unreadable dates terminate in UNKNOWN and advise consulting a licensed pharmacist.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

