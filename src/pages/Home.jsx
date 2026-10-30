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
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          The Honesty Contract: Deterministic date logic. Zero date hallucinations.
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B1F33] tracking-tight leading-tight">
          Check what the label <br className="hidden sm:inline" />
          <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
            can't tell you.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Smart packaging inspector for food, medicine, and cosmetics. Reads printed dates with OCR + Gemini vision, detects physical defects, and investigates verified manufacturer records when dates are missing.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all min-h-[44px]"
          >
            <Camera className="w-4 h-4" />
            Inspect a Product Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition-colors min-h-[44px]"
          >
            How It Works & Truth Ladder
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
