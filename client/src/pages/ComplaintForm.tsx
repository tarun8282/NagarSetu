import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Upload, FileText, CheckCircle2,
  ChevronRight, ChevronLeft, AlertCircle, Loader2, X,
  Navigation, ShieldX, RotateCcw, ImageIcon, Video,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import { AIVoiceInput } from '../components/ui/ai-voice-input';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX_BYTES = 30 * 1024 * 1024;  // 30 MB

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

interface LatLng { lat: number; lng: number }

interface MediaFile {
  file: File;
  previewUrl: string | null;
  sizeError: string | null;
}

function SuccessScreen({ trackingId, onGoDashboard }: { trackingId: string; onGoDashboard: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-india-green border-4 border-india-green-100 dark:border-india-green-900/40 flex items-center justify-center shadow-2xl shadow-india-green-200/50 dark:shadow-none">
          <CheckCircle2 size={50} className="text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-deva">Report Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
            Thank you for your report. Our AI has successfully classified and routed it to the correct department.
          </p>
        </div>
        <div className="w-full max-w-sm p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Tracking ID</p>
          <div className="text-3xl font-mono font-bold tracking-wider text-saffron dark:text-saffron-400 bg-white dark:bg-slate-800 py-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-inner">
            {trackingId}
          </div>
          <p className="text-xs text-slate-400 mt-4">Keep this ID safe to track your complaint status.</p>
        </div>
      </div>
      <button
        onClick={onGoDashboard}
        className="inline-flex items-center justify-center gap-2 px-10 py-4 w-full sm:w-auto bg-navy-blue text-white rounded-xl font-bold hover:bg-navy-blue-600 shadow-xl shadow-navy-blue-200/50 dark:shadow-none transition-all text-lg"
      >
        Go to My Dashboard
      </button>
    </div>
  );
}

function RejectedScreen({ reason, onReset }: { reason: string; onReset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldX size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Complaint Not Registered</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
          Our AI reviewed your complaint and determined it cannot be registered for the following reason:
        </p>
        <div className="w-full p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 font-medium text-sm leading-relaxed">
          "{reason}"
        </div>
        <p className="text-slate-400 text-xs">
          If you believe this is a mistake, please make sure your complaint describes a real, specific civic issue with clear details.
        </p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-8 py-3 bg-saffron text-white rounded-xl font-bold hover:bg-saffron-600 shadow-lg shadow-saffron-200/50 dark:shadow-none transition-all"
      >
        <RotateCcw size={18} /> Try Again
      </button>
    </div>
  );
}

const ComplaintForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const descriptionBeforeRecording = useRef('');
  const [address, setAddress] = useState('');
  const [pinPosition, setPinPosition] = useState<LatLng | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  const [submittedComplaintNo, setSubmittedComplaintNo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleMapPinChange = (pos: LatLng) => {
    setPinPosition(pos);
    reverseGeocode(pos.lat, pos.lng);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPinPosition(ll);
        reverseGeocode(ll.lat, ll.lng);
        setIsLocating(false);
      },
      (err) => { setError(`GPS error: ${err.message}`); setIsLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const slots = 5 - mediaFiles.length;
    const incoming = Array.from(e.target.files).slice(0, slots);

    const processed: MediaFile[] = incoming.map((file) => {
      const isVideo = file.type === 'video/mp4';
      const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
      const maxLabel = isVideo ? '30 MB' : '5 MB';

      let sizeError: string | null = null;
      if (file.size > maxBytes) {
        sizeError = `Too large (${formatBytes(file.size)}). Maximum is ${maxLabel}.`;
      }

      let previewUrl: string | null = null;
      if (!isVideo && !sizeError) {
        previewUrl = URL.createObjectURL(file);
      }

      return { file, previewUrl, sizeError };
    });

    setMediaFiles(prev => [...prev, ...processed].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const copy = [...prev];
      if (copy[index].previewUrl) URL.revokeObjectURL(copy[index].previewUrl!);
      copy.splice(index, 1);
      return copy;
    });
  };

  const hasFileSizeErrors = mediaFiles.some(m => m.sizeError !== null);

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!title.trim()) { setError('Please enter an issue title.'); return; }
      if (!description.trim()) { setError('Please enter a description.'); return; }
    }
    if (step === 2 && !pinPosition) {
      setError('Please pin your location on the map or use "Use My Location".');
      return;
    }
    if (step === 3 && hasFileSizeErrors) {
      setError('Please remove or replace the files marked with size errors before continuing.');
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => { setError(null); setStep(prev => Math.max(prev - 1, 1)); };

  const resetForm = () => {
    setTitle(''); setDescription(''); setAddress(''); setPinPosition(null);
    setMediaFiles([]); setError(null); setRejectedReason(null); setSubmittedComplaintNo(null); setStep(1);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!user) { setError('You must be logged in to submit a complaint.'); return; }
    if (hasFileSizeErrors) { setError('Please remove files with size errors first.'); return; }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('citizen_id', user.id);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('address', address || '');
      if (pinPosition) {
        formData.append('latitude', String(pinPosition.lat));
        formData.append('longitude', String(pinPosition.lng));
      }
      if (user.city_id)  formData.append('city_id',  user.city_id);
      if (user.state_id) formData.append('state_id', user.state_id);
      mediaFiles
        .filter(m => !m.sizeError)
        .forEach(m => formData.append('media', m.file));

      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.status === 422 && data.rejected) {
        setRejectedReason(data.rejection_reason);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Submission failed.');

      setSubmittedComplaintNo(data.complaint_number);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedComplaintNo) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative backdrop */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-india-green-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <SuccessScreen 
              trackingId={submittedComplaintNo} 
              onGoDashboard={() => navigate('/dashboard', { state: { complaintSubmitted: true, complaintNumber: submittedComplaintNo } })} 
            />
          </div>
        </div>
      </div>
    );
  }

  if (rejectedReason) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/40 rounded-xl p-8 shadow-xl">
          <RejectedScreen reason={rejectedReason} onReset={resetForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-deva">Report a Civic Issue</h1>
        <p className="text-slate-500 dark:text-slate-400">Fill in the details below to notify your municipal corporation.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all',
              step === s
                ? 'bg-saffron text-white shadow-lg shadow-saffron-200/60'
                : step > s
                  ? 'bg-india-green-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            )}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 3 && (
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div className={cn('h-full bg-saffron transition-all duration-500', step > s ? 'w-full' : 'w-0')} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-xl">

        {/* Step 1: Issue Details */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-saffron-600 dark:text-saffron-400 font-bold">
              <FileText /> Step 1: Issue Details
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Large pothole near Central Park gate"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-saffron-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the problem clearly — specific location details, how long it's been there, and how it's affecting the community..."
                    className="w-full px-4 py-3 pb-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-saffron-500 outline-none transition-all resize-none"
                  />
                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10 flex items-end">
                    <div className="pointer-events-auto w-full">
                      <AIVoiceInput 
                        onStart={() => {
                          descriptionBeforeRecording.current = description;
                        }}
                        onTranscript={(text) => {
                          const space = descriptionBeforeRecording.current && text ? ' ' : '';
                          setDescription(descriptionBeforeRecording.current + space + text);
                        }}
                        onStop={(duration) => console.log('Recording stopped:', duration)}
                        visualizerBars={100}
                        className="p-0 m-0"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Our AI will review your complaint before registering it. Make sure it describes a real civic issue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map Location */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-saffron-600 dark:text-saffron-400 font-bold">
              <MapPin /> Step 2: Pin Your Location
            </div>
            <MapPicker position={pinPosition} onChange={handleMapPinChange} />
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all bg-saffron text-white hover:bg-saffron-600 shadow-md shadow-saffron-200/50 dark:shadow-none disabled:opacity-70"
            >
              {isLocating
                ? <><Loader2 size={18} className="animate-spin" /> Detecting GPS…</>
                : <><Navigation size={18} /> Use My Current Location</>}
            </button>
            {pinPosition && (
              <div className="p-4 bg-india-green-50 dark:bg-india-green-900/20 border border-india-green-200 dark:border-india-green-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-india-green-700 dark:text-india-green-400 font-bold text-sm">
                  <CheckCircle2 size={16} /> Pin Placed
                  {isGeocoding && <Loader2 size={14} className="animate-spin ml-1" />}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {address || 'Resolving address…'}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {pinPosition.lat.toFixed(6)}, {pinPosition.lng.toFixed(6)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Additional address details{' '}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Landmark, near junction, building name…"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-saffron-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 3: Evidence Upload */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-saffron-600 dark:text-saffron-400 font-bold">
                <Upload /> Step 3: Evidence
                <span className="font-normal text-slate-400 text-sm">(Optional)</span>
              </div>
              <div className="text-xs text-slate-400 space-y-0.5 text-right">
                <div>📷 Images: max <strong>5 MB</strong></div>
                <div>🎥 Videos: max <strong>30 MB</strong></div>
              </div>
            </div>

            {mediaFiles.length < 5 && (
              <div
                className="border-2 border-dashed border-saffron-200 dark:border-saffron-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-saffron-50/50 dark:hover:bg-saffron-900/10 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,video/mp4"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-14 h-14 bg-saffron-100 dark:bg-saffron-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-saffron-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 dark:text-white">Click to add photos or video</p>
                  <p className="text-sm text-slate-500">PNG, JPG ≤ 5 MB · MP4 ≤ 30 MB · Up to 5 files</p>
                </div>
              </div>
            )}

            {mediaFiles.length > 0 && (
              <div className="space-y-3">
                {mediaFiles.map((mf, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      mf.sizeError
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                    )}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      {mf.previewUrl ? (
                        <img src={mf.previewUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : mf.file.type === 'video/mp4' ? (
                        <Video size={24} className="text-slate-400" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{mf.file.name}</p>
                      <p className={cn(
                        'text-xs mt-0.5',
                        mf.sizeError ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-400'
                      )}>
                        {mf.sizeError ? `⚠ ${mf.sizeError}` : formatBytes(mf.file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 p-1 rounded"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hasFileSizeErrors && (
              <p className="text-xs text-red-500 dark:text-red-400">
                ⚠ Remove files with size errors before submitting.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={20} /> Back
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 bg-saffron text-white rounded-lg font-bold hover:bg-saffron-600 shadow-lg shadow-saffron-200 dark:shadow-none transition-all"
            >
              Continue <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || hasFileSizeErrors}
              className="flex items-center gap-2 px-10 py-3 bg-india-green-500 text-white rounded-lg font-bold hover:bg-india-green-600 shadow-lg shadow-india-green-200 dark:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? <><Loader2 size={20} className="animate-spin" /> AI is reviewing…</>
                : 'Submit Complaint'}
            </button>
          )}
        </div>

        {isSubmitting && (
          <p className="text-center text-xs text-slate-400 mt-3 animate-pulse">
            Our AI is verifying your complaint before registering it. This may take a few seconds…
          </p>
        )}
      </div>
    </div>
  );
};

export default ComplaintForm;