import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, ShieldCheck, CheckCircle2, AlertOctagon, ArrowRight, Sparkles, FileText, Cpu, Check } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ProvenanceChip } from '../components/ui/ProvenanceChip.jsx';
import { PRIMARY_STATUS, PROVENANCE } from '../../shared/constants.js';

export function Home() {
  return (
    <div className="space-y-20 sm:space-y-28 py-10 sm:py-16">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 border border-slate-900/10 text-slate-800 text-xs sm:text-sm font-medium transition-all backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>The Honesty Contract: Zero Hallucinated Dates. Real Verification Only.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Smart packaging inspection <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            with verified AI vision.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AI-assisted verification for food, medicine, and cosmetics. Accurately identifies non-perishable goods (like computer hardware), detects physical packaging defects, and cross-checks official records.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-3 max-w-md mx-auto">
          <Link
            to="/scan"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Inspect a Product Now
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Link>
          <Link
            to="/how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-full font-semibold text-sm transition-all shadow-xs"
          >
            Truth Ladder & Rules
          </Link>
        </div>

        {/* Feature Highlights Bar */}
        <div className="pt-6 flex flex-wrap justify-center items-center gap-y-2 gap-x-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deterministic Math in JS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verbatim Web Citations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Electronics Refusal Filter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Local Tesseract OCR</span>
          </div>
        </div>
      </section>

      {/* Modern Interactive Output Preview Card */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:shadow-md">
          {/* Mock Browser/Window Header */}
          <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 ml-2 tracking-wide">
                Live Verification Inspection (Interactive Example)
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
              Demo Output
            </span>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                  Cosmetic • Radiance Booster Serum
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  DemoBrand Hydra-Glow Serum 30ml
                </h3>
              </div>
              <div>
                <StatusBadge status={PRIMARY_STATUS.ESTIMATED_VERIFIED_INPUTS} />
              </div>
            </div>

            {/* Split Details Section - Stacked on small screens, side-by-side with ample gap on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Calculated Date */}
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Calculated Expiry Date
                </span>
                
                <div className="space-y-2">
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                    14/01/2028
                  </div>
                  <div>
                    <ProvenanceChip provenance={PROVENANCE.CALCULATED} />
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed shadow-2xs">
                    MFG 15/01/2026 + 24 months - 1 day = 14/01/2028
                  </div>
                </div>
              </div>

              {/* Right Column: Verified Source Quote */}
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Verified Manufacturer Claim
                  </span>
                  
                  <blockquote className="mt-2 text-xs italic text-slate-800 leading-relaxed font-serif bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    "Unopened shelf life is 24 months from manufacture date"
                  </blockquote>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified verbatim quote from demobrand.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Pipeline */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How ExpiryWatch Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            A 4-step pipeline designed with strict anti-hallucination verification gates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            <div
              key={item.step}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3 hover:border-slate-300 hover:shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {item.step}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 pt-1">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                The Anti-Hallucination Contract
              </h3>
              <p className="text-xs text-slate-400">
                Guaranteed architectural constraints built directly into our codebase.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Never Invent Dates
              </span>
              <p className="text-slate-300 leading-relaxed">
                LLMs never perform date math. All date calculations and format resolutions are executed by deterministic code in <code className="text-indigo-300 font-mono">shared/</code>.
              </p>
            </div>

            <div className="space-y-1.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Never Say "Safe to Use"
              </span>
              <p className="text-slate-300 leading-relaxed">
                We state: "No expiry problem found on the printed date. This does not guarantee safety." Chemical and microbiological safety requires laboratory inspection.
              </p>
            </div>

            <div className="space-y-1.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                No Generic Shelf-Life Guessing
              </span>
              <p className="text-slate-300 leading-relaxed">
                Calculations require a verified verbatim claim from an official manufacturer or regulator source matching the exact product.
              </p>
            </div>

            <div className="space-y-1.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                No Medicine Guesses
              </span>
              <p className="text-slate-300 leading-relaxed">
                Medicines with unreadable or missing dates terminate strictly in UNKNOWN with guidance to consult a licensed pharmacist.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


