import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '../../../shared/constants.js';

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EF] bg-white mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="font-heading font-semibold text-sm text-[#0B1F33]">
              ExpiryWatch AI
            </span>
            <span className="text-xs text-slate-400">| The Honesty Contract</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 font-medium">
            <Link to="/how-it-works" className="hover:text-indigo-600 transition-colors">
              Truth Ladder
            </Link>
            <Link to="/how-it-works" className="hover:text-indigo-600 transition-colors">
              Verified Sources
            </Link>
            <Link to="/scan" className="hover:text-indigo-600 transition-colors">
              New Inspection
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {SAFETY_DISCLAIMER}
            <br />
            Photos are processed transiently in memory and never stored on the server. Your scan history is stored strictly in your local browser.
          </p>
        </div>
      </div>
    </footer>
  );
}

