import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Camera, Download, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';
import { getScanRecord, saveScanRecord, deleteScanRecord } from '../lib/history.js';
import { postInvestigate } from '../lib/api.js';
import { assess } from '../../shared/assess.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ExpiryCard } from '../components/result/ExpiryCard.jsx';
import { DamageOverlay } from '../components/result/DamageOverlay.jsx';
import { InvestigationAccordion } from '../components/result/InvestigationAccordion.jsx';
import { RecommendationsCard } from '../components/result/RecommendationsCard.jsx';
import { ContactCareCard } from '../components/result/ContactCareCard.jsx';
import { formatIsoDate } from '../lib/format.js';

export function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [record, setRecord] = useState(location.state?.record || null);
  const [loading, setLoading] = useState(!record);
  const [isInvestigating, setIsInvestigating] = useState(false);

  useEffect(() => {
    if (!record && id) {
      getScanRecord(id).then((saved) => {
        if (saved) {
          setRecord(saved);
        } else {
          toast.error('Scan record not found in history.');
          navigate('/history');
        }
        setLoading(false);
      });
    }
  }, [id, record, navigate]);

  const handleTriggerInvestigation = async () => {
    if (!record) return;
    setIsInvestigating(true);

    try {
      const barcodeVal = record.extraction?.barcodes?.[0]?.value || null;
      const batchVal = record.extraction?.batchNumbers?.[0]?.value || null;
      const mfgDate = record.extraction?.dates?.find((d) => d.kind === 'MFG')?.parsed?.iso || null;

      const response = await postInvestigate({
        identity: record.extraction.product,
        barcode: barcodeVal,
        batchNumber: batchVal,
        mfgDate,
      });

      const updatedInvestigation = response.investigation;

      // Re-assess with investigation conclusion
      const reassessment = assess({
        extraction: record.extraction,
        investigation: updatedInvestigation,
        userOverrides: {},
      });

      const updatedRecord = {
        ...record,
        investigation: updatedInvestigation,
        assessment: reassessment,
      };

      await saveScanRecord(updatedRecord);
      setRecord(updatedRecord);
      toast.success('Investigation completed and findings evaluated.');
    } catch (err) {
      console.error('Investigation error:', err);
      toast.error(err.message || 'Failed to complete manufacturer investigation.');
    } finally {
      setIsInvestigating(false);
    }
  };

  // Auto-investigate when expiry date is missing but product has start date (MFG) or clues
  useEffect(() => {
    if (
      record &&
      !record.investigation?.ran &&
      !isInvestigating &&
      (record.assessment?.primaryStatus === 'EXPIRY_NOT_FOUND' || record.assessment?.expiry?.provenance === 'UNKNOWN') &&
      record.extraction?.product?.name &&
      record.extraction?.product?.brand &&
      !record.extraction?.product?.isNonPerishable &&
      !record.assessment?.isUndatedPackaging
    ) {
      handleTriggerInvestigation();
    }
  }, [record]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this scan from history?')) return;
    await deleteScanRecord(record.id);
    toast.success('Scan removed from history.');
    navigate('/history');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-600">Loading inspection findings...</p>
      </div>
    );
  }

  if (!record) return null;

  const { product, dates, batchNumbers, damage, customerContact, barcodes } = record.extraction || {};
  const assessment = record.assessment || {};
  const isDemo = record.meta?.source === 'demo' || record.investigation?.isDemo;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Top Bar Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E7EF]">
        <Link
          to="/scan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scanner
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/scan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Inspect Another Product
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>DEMO DATA: not read from your photo (running in canned demo verification mode)</span>
        </div>
      )}

      {/* Primary Status Banner */}
      <div className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            Inspection Primary Status
          </span>
          <StatusBadge status={assessment.primaryStatus} size="lg" />
        </div>

        <div className="text-right sm:max-w-xs">
          <span className="text-xs text-slate-500 block">Inspected at</span>
          <span className="text-xs font-mono font-medium text-slate-800">
            {new Date(record.savedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Undated / Missing Baseline Date Warning Banner */}
      {(assessment.isUndatedPackaging || assessment.flags?.some((f) => f.type === 'INVALID_UNDATED_PACKAGING')) && (
        <div className="bg-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-5 text-amber-950 flex items-start gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full inline-block">
              Invalid / Undated Packaging
            </span>
            <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900">
              No Manufacturing (MFG), Packing, or Expiration Date Found
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              This product does not have any baseline start date (MFG/Packed date) or expiration marking visible on the packaging. Under consumer safety standards, consuming unverified undated perishable goods is unsafe.
            </p>
          </div>
        </div>
      )}

      {/* Core Expiry Assessment Card */}
      <ExpiryCard
        expiry={assessment.expiry || {}}
        expiryState={assessment.expiryState}
        unknownMessage={assessment.unknownMessage}
      />

      {/* Product Identity Card */}
      <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-semibold text-sm text-[#0B1F33]">
            Product Identity
          </h4>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Confidence: {((product?.identityConfidence || 0.5) * 100).toFixed(0)}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Name</span>
            <span className="font-semibold text-slate-900">{product?.name || 'N/A'}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Brand</span>
            <span className="font-semibold text-slate-900">{product?.brand || 'N/A'}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
            <span className="font-semibold text-slate-900 capitalize">{product?.category || 'Food'}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Batch / LOT</span>
            <span className="font-mono font-semibold text-slate-900">{batchNumbers?.[0]?.value || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Packaging Damage Overlays */}
      <DamageOverlay
        images={record.images || []}
        findings={damage?.findings || []}
      />

      {/* Online Verification Proof Card */}
      {record.investigation?.conclusion?.type === 'SHELF_LIFE' && (
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="font-heading font-bold text-sm text-emerald-950">
                Official Manufacturer Proof Found Online
              </h4>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300/80">
              Verified Web Evidence
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            We searched official repositories and found verbatim documentation matching this exact product:
          </p>

          <blockquote className="p-3 bg-white rounded-xl border border-emerald-200/80 font-serif italic text-xs text-slate-800 shadow-2xs leading-relaxed">
            "{record.investigation.conclusion.quote}"
          </blockquote>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <span className="text-emerald-800 font-semibold flex items-center gap-1">
              ✓ Verified matching shelf life: {record.investigation.conclusion.amount} {record.investigation.conclusion.unit}
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              Formula: Confirmed Start Date (MFG) + {record.investigation.conclusion.amount} {record.investigation.conclusion.unit} - 1 day
            </span>
          </div>
        </div>
      )}

      {/* Manufacturer Investigation Accordion */}
      <InvestigationAccordion
        investigation={record.investigation}
        onTriggerInvestigation={handleTriggerInvestigation}
        isInvestigating={isInvestigating}
      />

      {/* Category Recommendations & Safety Guidance */}
      <RecommendationsCard
        recommendation={assessment.recommendation}
      />

      {/* Contact Care Details & Email Draft */}
      <ContactCareCard
        contact={customerContact || {}}
        product={product || {}}
        batch={batchNumbers?.[0]?.value || ''}
      />
    </div>
  );
}

