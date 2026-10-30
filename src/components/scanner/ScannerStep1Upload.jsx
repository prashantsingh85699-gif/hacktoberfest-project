import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, HelpCircle, Shield, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { processImageFile } from '../../lib/image.js';

const ROLES = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'label', label: 'Nutrition / Drug Label' },
  { id: 'batch', label: 'Batch / EXP Stamp' },
  { id: 'other', label: 'Other' },
];

const PRESET_SAMPLES = [
  {
    id: 'food_printed',
    title: 'Whole Grain Oats',
    subtitle: 'Printed Expiry (Food)',
    icon: '🌾',
    file: '/samples/fixture-1-printed-exp.jpg',
    category: 'food',
    productHint: 'Whole Grain Rolled Oats 1kg',
  },
  {
    id: 'cosmetic_missing',
    title: 'Vitamin C Serum',
    subtitle: 'Missing EXP + 12M PAO',
    icon: '🧴',
    file: '/samples/fixture-2-missing-exp.jpg',
    category: 'cosmetic',
    productHint: 'Hydra-Glow Vitamin C Serum 30ml',
  },
  {
    id: 'mouse_hardware',
    title: 'Computer Mouse',
    subtitle: 'Non-Perishable Hardware',
    icon: '🖱️',
    file: '/samples/fixture-7-computer-mouse.jpg',
    category: 'electronics',
    productHint: 'Optical USB Computer Mouse',
  },
  {
    id: 'medicine_unreadable',
    title: 'Demo-Cillin 500mg',
    subtitle: 'Damaged Stamp (Pharma)',
    icon: '💊',
    file: '/samples/fixture-1-printed-exp.jpg',
    category: 'medicine',
    productHint: 'Demo-Cillin 500mg Capsules',
  },
  {
    id: 'damaged_can',
    title: 'Tomato Puree Can',
    subtitle: 'Swollen Packaging Defect',
    icon: '🥫',
    file: '/samples/fixture-6-damaged-pack.jpg',
    category: 'food',
    productHint: 'Canned Tomato Puree',
  },
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
  const [loadingSample, setLoadingSample] = useState(null);
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

  const loadSample = async (sample) => {
    setErrorMsg('');
    setLoadingSample(sample.id);

    try {
      const res = await fetch(sample.file);
      if (!res.ok) throw new Error('Sample image file not found');
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      const processed = await processImageFile(file);

      setImages([
        {
          file,
          data: processed.data,
          dataUrl: processed.dataUrl,
          mimeType: processed.mimeType,
          role: 'front',
        },
      ]);

      setHints({
        ...hints,
        category: sample.category,
        productHint: sample.productHint,
      });
    } catch (err) {
      setErrorMsg('Could not load sample fixture image.');
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1-Click Interactive Test Samples */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1F33]">
              Quick Test Samples (Instant 1-Click Load)
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            No camera needed
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Choose a scenario to load a sample packaging photo and test the inspection logic:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={loadingSample !== null}
              onClick={() => loadSample(s)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 group active:scale-95 min-h-[90px] ${
                hints.productHint === s.productHint
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{s.icon}</span>
                {hints.productHint === s.productHint && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div>
                <span className="font-heading font-bold text-[11px] sm:text-xs text-slate-900 block truncate">
                  {s.title}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {s.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload / Camera Zone */}
      <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-6 sm:p-10 text-center bg-white shadow-xs transition-colors space-y-4">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
          <Camera className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-heading font-bold text-lg sm:text-xl text-[#0B1F33]">
            {images.length > 0 ? `${images.length} Photo Ready for Inspection` : 'Capture or Upload Product Photos'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Take clear photos of front label, bottom, or stamped batch code. Supports JPG, PNG, WebP up to 5 photos.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto pt-1">
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
            Choose Files
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
          <p className="text-xs text-indigo-600 animate-pulse font-medium">Compressing & optimizing image...</p>
        )}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Previews Grid */}
      {images.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Attached Photos ({images.length} / 5):
            </h4>
            <span className="text-[11px] text-slate-400">Select angle tag for maximum accuracy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-200">
                  <img src={img.dataUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded font-mono">
                    Photo #{idx + 1}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                    Angle Role:
                  </label>
                  <select
                    value={img.role}
                    onChange={(e) => updateRole(idx, e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

      {/* Product Hints & Context */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <h4 className="font-heading font-bold text-sm text-[#0B1F33]">
          Inspection Context & Category
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={hints.category || ''}
              onChange={(e) => setHints({ ...hints, category: e.target.value })}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Auto-Detect from Label</option>
              <option value="food">Food & Beverage (Perishable)</option>
              <option value="medicine">Medicine / Pharmaceutical</option>
              <option value="cosmetic">Cosmetics & Personal Care</option>
              <option value="electronics">Electronics / Hardware (Non-perishable)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name / Model Hint
            </label>
            <input
              type="text"
              placeholder="e.g. Rolled Oats, Computer Mouse, Paracetamol"
              value={hints.productHint || ''}
              onChange={(e) => setHints({ ...hints, productHint: e.target.value })}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Primary Proceed CTA */}
      <div className="pt-2">
        <button
          type="button"
          disabled={images.length === 0 || processing}
          onClick={onStartAnalysis}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-300 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md hover:shadow-xl transition-all active:scale-[0.98] min-h-[52px]"
        >
          Proceed to Inspection ({images.length} {images.length === 1 ? 'photo' : 'photos'})
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          Photos are processed transiently in memory and never stored on the server. Your scan history lives strictly in your browser.
        </span>
      </div>
    </div>
  );
}
