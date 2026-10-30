import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, HelpCircle, Shield, AlertCircle } from 'lucide-react';
import { processImageFile } from '../../lib/image.js';

const ROLES = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'label', label: 'Nutrition / Drug Label' },
  { id: 'batch', label: 'Batch / EXP Stamp' },
  { id: 'other', label: 'Other' },
];

export function ScannerStep1Upload({
  images,
  setImages,
  hints,
  setHints,
  onStartAnalysis,
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = async (fileList) => {
    setErrorMsg('');
    if (!fileList || fileList.length === 0) return;

    if (images.length + fileList.length > 5) {
      setErrorMsg('You can upload a maximum of 5 photos per product inspection.');
      return;
    }

    setProcessing(true);
    const newItems = [];

    for (const file of fileList) {
      try {
        const processed = await processImageFile(file);
        newItems.push({
          file,
          data: processed.data,
          dataUrl: processed.dataUrl,
          mimeType: processed.mimeType,
          role: images.length === 0 && newItems.length === 0 ? 'front' : 'label',
        });
      } catch (err) {
        setErrorMsg(err.message || 'Failed to process image');
      }
    }

    setImages([...images, ...newItems]);
    setProcessing(false);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateRole = (index, role) => {
    const updated = [...images];
    updated[index].role = role;
    setImages(updated);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <span className="font-semibold">Privacy & Safety Notice:</span> Packaging photos are analyzed in memory by AI vision models and never stored on our servers. Your scan history lives strictly in your local browser storage.
        </div>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 sm:p-8 text-center bg-white transition-colors">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-3">
          <Camera className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-semibold text-base text-[#0B1F33]">
          Upload Product Photos (Up to 5)
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Capture the front, back, bottom, label, and especially the printed batch / expiration date stamp.
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 min-h-[48px]"
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-xs transition-colors active:scale-95 min-h-[48px]"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Choose Photos
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          capture="environment"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {processing && (
          <p className="text-xs text-indigo-600 mt-3 animate-pulse">Compressing and preparing photos...</p>
        )}
        {errorMsg && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-rose-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Previews & Role Tags */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Uploaded Photos ({images.length} / 5) - Tag angle for best accuracy:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="bg-white border border-[#E5E7EF] rounded-xl p-3 shadow-xs space-y-2">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100">
                  <img src={img.dataUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded font-mono">
                    #{idx + 1}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Image Role / Angle:
                  </label>
                  <select
                    value={img.role}
                    onChange={(e) => updateRole(idx, e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Tips */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          Inspection Quality Tips:
        </span>
        <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
          <li>Keep packaging flat and ensure uniform lighting without direct flash glare.</li>
          <li>For medicines, take a high-resolution close-up of the foil blister crimp or carton top.</li>
          <li>For cosmetics, check the bottom for batch stamps and the open-jar symbol (e.g. 12M).</li>
        </ul>
      </div>

      {/* Optional Packaging Hints */}
      <div className="bg-white border border-[#E5E7EF] rounded-xl p-4 sm:p-5 space-y-4">
        <h4 className="font-heading font-semibold text-sm text-[#0B1F33]">
          Optional Inspection Context
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Product Category
            </label>
            <select
              value={hints.category || ''}
              onChange={(e) => setHints({ ...hints, category: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Auto-Detect from Label</option>
              <option value="food">Food & Beverage</option>
              <option value="medicine">Medicine / Pharmaceutical</option>
              <option value="cosmetic">Cosmetics & Personal Care</option>
              <option value="electronics">Electronics / Hardware (Non-perishable)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Known Brand or Product Hint (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Quaker Oats, Paracetamol 500mg"
              value={hints.productHint || ''}
              onChange={(e) => setHints({ ...hints, productHint: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hints.isOpened || false}
                onChange={(e) => setHints({ ...hints, isOpened: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Product has already been opened
            </label>

            {hints.isOpened && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Opened on:</span>
                <input
                  type="date"
                  value={hints.openedOn || ''}
                  onChange={(e) => setHints({ ...hints, openedOn: e.target.value })}
                  className="text-xs border border-slate-300 rounded-lg p-1.5"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Analysis CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={images.length === 0 || processing}
          onClick={onStartAnalysis}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors min-h-[44px]"
        >
          Proceed to Inspection ({images.length} {images.length === 1 ? 'photo' : 'photos'})
        </button>
      </div>
    </div>
  );
}

