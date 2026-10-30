import React from 'react';
import { ShieldCheck, HelpCircle, AlertOctagon, CheckCircle2, Lock, Cpu, Globe, Search } from 'lucide-react';
import { ProvenanceChip } from '../components/ui/ProvenanceChip.jsx';
import { PROVENANCE, EXACT_UNKNOWN_MESSAGE, SAFETY_DISCLAIMER } from '../../shared/constants.js';

export function About() {
  const ladderRows = [
    {
      provenance: PROVENANCE.PRINTED,
      name: 'PRINTED',
      meaning: 'Date printed directly on pack (EXP / Best Before / Use By)',
      condition: 'Read by vision AI and corroborated by OCR worker, or explicitly confirmed by user.',
    },
    {
      provenance: PROVENANCE.LABEL_RULE,
      name: 'LABEL_RULE',
      meaning: 'Label explicitly states relative rule ("Best before 9 months from manufacture")',
      condition: 'Rule read + confirmed manufacturing (MFG) date; calculated deterministically in shared code.',
    },
    {
      provenance: PROVENANCE.MANUFACTURER_CONFIRMED,
      name: 'MANUFACTURER_CONFIRMED',
      meaning: 'Manufacturer / regulator states expiration for this exact batch code',
      condition: 'Verified source quote contains exact batch string AND a parseable full expiration date.',
    },
    {
      provenance: PROVENANCE.CALCULATED,
      name: 'CALCULATED',
      meaning: 'Confirmed MFG date + verified manufacturer shelf-life claim',
      condition: 'Verbatim quote verified as a substring of fetched official page text + exact product match.',
    },
    {
      provenance: PROVENANCE.UNKNOWN,
      name: 'UNKNOWN',
      meaning: 'None of the above criteria satisfied',
      condition: `Refuses to invent dates. Outputs exactly: "${EXACT_UNKNOWN_MESSAGE}"`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-12">
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33] font-heading">
          The Honesty Contract & Architecture
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          How ExpiryWatch AI protects consumers from hallucinated dates, speculative shelf lives, and unverified assumptions.
        </p>
      </div>

      {/* The Truth Ladder */}
      <section className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="font-heading font-bold text-lg text-[#0B1F33]">
            The Truth Ladder
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Every expiration date shown in ExpiryWatch AI carries exactly one provenance level. A date is never displayed without verified backing.
        </p>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {ladderRows.map((row) => (
            <div key={row.name} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 max-w-sm">
                <ProvenanceChip provenance={row.provenance} />
                <p className="font-semibold text-slate-900 mt-1">{row.meaning}</p>
              </div>
              <div className="text-slate-600 sm:max-w-md bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block text-[10px] uppercase">Condition:</span>
                {row.condition}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified vs Ineligible Sources */}
      <section className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#0B1F33]">
          Source Classification & Anti-Hallucination Gates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Eligible for Calculation:
            </span>
            <ul className="list-disc list-inside space-y-1 text-emerald-950 pl-1">
              <li>
                <span className="font-semibold">Official Manufacturer Domains:</span> Domains verified through tldts matching the product's brand or manufacturer.
              </li>
              <li>
                <span className="font-semibold">Official Regulators (Medicines only):</span> FDA (accessdata.fda.gov), DailyMed (NIH), EMA, MHRA, CDSCO.
              </li>
            </ul>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
            <span className="font-bold text-rose-900 flex items-center gap-1.5 text-sm">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Reference Only (Never Calculate):
            </span>
            <ul className="list-disc list-inside space-y-1 text-rose-950 pl-1">
              <li>Retailers & Marketplaces (Amazon, BigBasket, Blinkit, Walmart, Flipkart).</li>
              <li>Crowd-sourced databases (Open Food Facts, Wikipedia, forums, Reddit).</li>
              <li>Third-party batch decoder websites (CheckFresh, etc.).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy & Stateless Architecture */}
      <section className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#0B1F33]">
          Privacy & Stateless Architecture
        </h2>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            • <span className="font-semibold text-slate-800">Zero Server Storage:</span> Images and text are processed strictly in memory on serverless functions. Nothing is logged, cached, or written to disk on our servers.
          </p>
          <p>
            • <span className="font-semibold text-slate-800">Local Browser History:</span> Your scan records and thumbnails are stored exclusively inside your device's browser using IndexedDB (idb-keyval).
          </p>
          <p>
            • <span className="font-semibold text-slate-800">In-Browser OCR:</span> Optical Character Recognition runs inside a WebAssembly Web Worker (Tesseract.js v6) in your browser before any data is sent.
          </p>
        </div>
      </section>

      {/* Limitations & Disclaimers */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 text-xs text-slate-600">
        <h3 className="font-heading font-bold text-sm text-[#0B1F33]">
          Known Limitations & Assistive Disclaimers
        </h3>
        <p>
          1. <span className="font-semibold">Curved & Embossed Print:</span> Stamped expiration codes on clear bottle necks or crimped foils can be degraded by reflective glare or friction. Always confirm the read value in Step 3.
        </p>
        <p>
          2. <span className="font-semibold">Proprietary Batch Codes:</span> Most consumer manufacturers do not publicly publish their batch decoding keys. ExpiryWatch AI investigates manufacturer documentation but will never invent an unverified algorithm.
        </p>
        <p className="pt-2 font-medium text-slate-700">
          {SAFETY_DISCLAIMER}
        </p>
      </section>
    </div>
  );
}

