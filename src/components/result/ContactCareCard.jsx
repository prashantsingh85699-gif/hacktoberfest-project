import React, { useState } from 'react';
import { Phone, Mail, Globe, Copy, Check, Send } from 'lucide-react';

export function ContactCareCard({ contact = {}, product = {}, batch = '' }) {
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const phone = contact.phone || '';
  const email = contact.email || '';
  const website = contact.website || '';

  const emailSubject = `Inquiry regarding expiration / batch validity for ${product.name || 'Product'} (Batch: ${batch || 'N/A'})`;
  const emailBody = `Dear Customer Support Team at ${product.manufacturer || product.brand || 'Customer Care'},

I am writing to verify the exact expiration date and unopened shelf life for the following product:
- Product: ${product.name || 'N/A'}
- Brand: ${product.brand || 'N/A'}
- Strength / Variant: ${product.strength || product.variant || 'Standard'}
- Batch / LOT Number: ${batch || '[Please see photo / enter batch]'}

Could you please confirm the manufacturing date, expiration date, and recommended storage conditions for this batch?

Thank you,
Consumer`;

  const copyDraft = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasAnyContact = phone || email || website;

  return (
    <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="font-heading font-semibold text-sm text-[#0B1F33]">
          Customer Care & Manufacturer Contact
        </h4>

        <button
          type="button"
          onClick={() => setShowEmailModal(!showEmailModal)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors self-start"
        >
          <Mail className="w-3.5 h-3.5" />
          {showEmailModal ? 'Hide Email Draft' : 'Draft Manufacturer Inquiry'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Phone</span>
            <span className="text-slate-800 font-medium">{phone || 'Not detected on pack'}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email</span>
            <span className="text-slate-800 font-medium">{email || 'Not detected on pack'}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Website</span>
            {website ? (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-medium"
              >
                {website}
              </a>
            ) : (
              <span className="text-slate-800 font-medium">Not detected on pack</span>
            )}
          </div>
        </div>
      </div>

      {showEmailModal && (
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Copyable Manufacturer Inquiry Template
            </span>
            <button
              type="button"
              onClick={copyDraft}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Template'}
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg border border-indigo-100 font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
            <div className="font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-2">
              Subject: {emailSubject}
            </div>
            {emailBody}
          </div>
        </div>
      )}
    </div>
  );
}

