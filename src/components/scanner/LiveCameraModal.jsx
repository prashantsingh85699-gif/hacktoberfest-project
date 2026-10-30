import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles, SwitchCamera } from 'lucide-react';

export function LiveCameraModal({ isOpen, onClose, onCapturePhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraState, setCameraState] = useState('starting'); // 'starting' | 'streaming' | 'captured' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check available devices
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      if (videoDevices.length > 1) {
        setHasMultipleCameras(true);
      }
    }).catch(() => {});
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode = facingMode) => {
    stopStream();
    setCameraState('starting');
    setErrorMessage('');
    setCapturedDataUrl(null);
    setCapturedBlob(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('error');
      setErrorMessage('Camera access is not supported by this browser. Please use photo upload instead.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraState('streaming');
          }).catch((err) => {
            setCameraState('error');
            setErrorMessage('Could not play live video stream: ' + err.message);
          });
        };
      }
    } catch (err) {
      setCameraState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser settings to scan packaging live.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera hardware was detected on this device. Please use photo upload instead.');
      } else {
        setErrorMessage('Failed to start camera: ' + (err.message || 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const takePhoto = () => {
    if (!videoRef.current || cameraState !== 'streaming') return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCameraState('captured');
      }
    }, 'image/jpeg', 0.92);
  };

  const retakePhoto = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setCameraState('streaming');
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    } else {
      startCamera(facingMode);
    }
  };

  const confirmPhoto = () => {
    if (!capturedBlob || !capturedDataUrl) return;

    const timestamp = Date.now();
    const file = new File([capturedBlob], `scan_capture_${timestamp}.jpg`, {
      type: 'image/jpeg',
    });

    onCapturePhoto(file);
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Camera Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-10 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              {cameraState === 'captured' ? 'Photo Preview' : 'Live Packaging Camera'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasMultipleCameras && cameraState === 'streaming' && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Switch Camera (Front/Back)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopStream();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              aria-label="Close camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] bg-black flex items-center justify-center overflow-hidden">
          {/* Live Video View */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraState === 'captured' ? 'hidden' : 'block'}`}
          />

          {/* Captured Preview View */}
          {cameraState === 'captured' && capturedDataUrl && (
            <img
              src={capturedDataUrl}
              alt="Captured Product"
              className="w-full h-full object-contain"
            />
          )}

          {/* Target Alignment Reticle / HUD */}
          {cameraState === 'streaming' && (
            <div className="absolute inset-8 pointer-events-none flex flex-col justify-between items-center">
              <div className="w-full flex justify-between">
                <div className="w-8 h-8 border-t-3 border-l-3 border-indigo-400 rounded-tl-xl" />
                <div className="w-8 h-8 border-t-3 border-r-3 border-indigo-400 rounded-tr-xl" />
              </div>

              <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-medium shadow-lg tracking-wide text-center max-w-xs">
                Align printed expiry date or barcode inside frame
              </div>

              <div className="w-full flex justify-between">
                <div className="w-8 h-8 border-b-3 border-l-3 border-indigo-400 rounded-bl-xl" />
                <div className="w-8 h-8 border-b-3 border-r-3 border-indigo-400 rounded-br-xl" />
              </div>
            </div>
          )}

          {/* Loading / Starting Camera State */}
          {cameraState === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 space-y-3 bg-slate-950">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Starting live camera hardware...</p>
            </div>
          )}

          {/* Error State */}
          {cameraState === 'error' && (
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Camera Access Error</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-full transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Bottom Shutter & Action Controls */}
        <div className="px-6 py-5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-center">
          {cameraState === 'streaming' && (
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={takePhoto}
                className="w-16 h-16 rounded-full bg-white p-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
                aria-label="Capture photo"
              >
                <div className="w-full h-full rounded-full border-2 border-slate-950 group-hover:bg-slate-100 transition-colors" />
              </button>
            </div>
          )}

          {cameraState === 'captured' && (
            <div className="flex items-center justify-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={retakePhoto}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </div>
          )}

          {cameraState === 'starting' && (
            <span className="text-xs text-slate-500">Initializing viewfinder...</span>
          )}

          {cameraState === 'error' && (
            <button
              type="button"
              onClick={() => {
                stopStream();
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
