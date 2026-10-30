import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ScannerStep1Upload } from '../components/scanner/ScannerStep1Upload.jsx';
import { ScannerStep2Progress } from '../components/scanner/ScannerStep2Progress.jsx';
import { ScannerStep3Confirm } from '../components/scanner/ScannerStep3Confirm.jsx';
import { recognizePackagingText } from '../lib/ocr.js';
import { detectBarcodesFromCanvas } from '../lib/barcode.js';
import { postScan } from '../lib/api.js';
import { saveScanRecord } from '../lib/history.js';

export function Scanner() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Upload, 2: Progress, 3: Confirm
  const [currentStage, setCurrentStage] = useState('prep');
  const [images, setImages] = useState([]);
  const [hints, setHints] = useState({});
  const [extractionResult, setExtractionResult] = useState(null);
  const [isCancelled, setIsCancelled] = useState(false);

  const startAnalysis = async () => {
    if (images.length === 0) return;
    setStep(2);
    setIsCancelled(false);

    try {
      // Stage 1: Prep
      setCurrentStage('prep');
      await new Promise((r) => setTimeout(r, 400));

      // Stage 2 & 3: OCR
      setCurrentStage('ocr_init');
      const ocrResults = [];
      for (let i = 0; i < images.length; i++) {
        setCurrentStage('ocr_read');
        const ocr = await recognizePackagingText(images[i].dataUrl);
        ocrResults.push({
          imageIndex: i,
          text: ocr.text,
          meanConfidence: ocr.meanConfidence,
        });
      }

      // Stage 4: Barcodes
      setCurrentStage('barcode');
      const barcodeResults = [];
      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        img.src = images[i].dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const barcodes = await detectBarcodesFromCanvas(canvas);
        for (const b of barcodes) {
          barcodeResults.push({
            imageIndex: i,
            format: b.format,
            value: b.value,
          });
        }
      }

      // Stage 5: Vision Analysis
      setCurrentStage('vision');
      const payload = {
        images: images.map((img) => ({
          role: img.role,
          mimeType: img.mimeType,
          data: img.data,
        })),
        ocr: ocrResults,
        barcodes: barcodeResults,
        hints,
      };

      const scanResponse = await postScan(payload);

      setExtractionResult(scanResponse);
      setStep(3);
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error(err.message || 'Inspection failed');
      // If AI failed, offer manual entry fallback
      if (err.code === 'AI_UNAVAILABLE') {
        toast.info('Switching to manual entry mode.');
        setExtractionResult({
          extraction: {
            product: { category: hints.category || 'food', name: hints.productHint || '' },
            dates: [],
            labelRules: [],
            batchNumbers: [],
            damage: { findings: [] },
          },
          assessment: null,
          meta: { source: 'manual', model: null },
        });
        setStep(3);
      } else {
        setStep(1);
      }
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    setStep(1);
    toast.info('Inspection cancelled.');
  };

  const handleConfirmFinal = async (confirmedData) => {
    const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullRecord = {
      id,
      savedAt: new Date().toISOString(),
      images: images.map((img) => ({
        role: img.role,
        dataUrl: img.dataUrl,
      })),
      extraction: {
        ...extractionResult?.extraction,
        product: confirmedData.product,
        dates: confirmedData.dates,
        pao: confirmedData.pao,
      },
      assessment: confirmedData.assessment,
      investigation: null,
      meta: extractionResult?.meta || {},
    };

    try {
      await saveScanRecord(fullRecord);
      toast.success('Inspection verified and saved to history!');
      navigate(`/result/${id}`, { state: { record: fullRecord } });
    } catch (err) {
      console.error('Failed to save scan record:', err);
      // Navigate anyway with state
      navigate(`/result/${id}`, { state: { record: fullRecord } });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Stepper Navigation */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-2">
        {[
          { num: 1, label: 'Photos' },
          { num: 2, label: 'Analyzing' },
          { num: 3, label: 'Confirm' },
          { num: 4, label: 'Report' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </div>
            <span
              className={`hidden sm:inline text-xs font-semibold ${
                step === s.num ? 'text-indigo-900' : 'text-slate-500'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Components */}
      {step === 1 && (
        <ScannerStep1Upload
          images={images}
          setImages={setImages}
          hints={hints}
          setHints={setHints}
          onStartAnalysis={startAnalysis}
        />
      )}

      {step === 2 && (
        <ScannerStep2Progress
          currentStage={currentStage}
          onCancel={handleCancel}
        />
      )}

      {step === 3 && extractionResult && (
        <ScannerStep3Confirm
          extraction={extractionResult.extraction}
          onConfirmFinal={handleConfirmFinal}
        />
      )}
    </div>
  );
}
