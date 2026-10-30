import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mx-auto">
        <HelpCircle className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-extrabold text-[#0B1F33] font-heading">
        Page Not Found
      </h1>
      <p className="text-xs text-slate-500">
        The requested inspection view or resource could not be found.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>
    </div>
  );
}
