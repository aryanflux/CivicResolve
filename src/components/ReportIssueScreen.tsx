/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Category, Severity, CommunityReport } from '../types';
import { MapPin, AlertCircle, ArrowLeft, Send, ShieldCheck, HelpCircle } from 'lucide-react';

interface ReportIssueScreenProps {
  prefilledCoords: [number, number] | null;
  prefilledLocationName: string;
  onGoBack: () => void;
  onSubmitReport: (data: {
    title: string;
    category: Category;
    severity: Severity;
    description: string;
    coordinates: [number, number];
    locationName: string;
    author: string;
    authorId: string;
  }) => Promise<any>;
  currentUser: { username: string; userId: string };
}

const CATEGORIES: { value: Category; label: string; emoji: string; desc: string }[] = [
  { value: 'Roads', label: 'Roads & Potholes', emoji: '🕳️', desc: 'Broken roads, craters, speedbreakers, or pavement issues' },
  { value: 'Waste', label: 'Solid Waste & Dumpsters', emoji: '🗑️', desc: 'Garbage piles, clogged community bins, or dead animals' },
  { value: 'Lighting', label: 'Street Lighting', emoji: '💡', desc: 'Broken high-masts, dark alleys, or short-circuited lamps' },
  { value: 'Water', label: 'Water & Sewage', emoji: '🚰', desc: 'Burst water mains, leaking pipes, waterlogging, or blocked drains' },
  { value: 'Other', label: 'Other Concerns', emoji: '⚠️', desc: 'Public property damage, noise pollution, or animal hazards' },
];

const SEVERITIES: { value: Severity; label: string; bg: string; text: string; desc: string }[] = [
  { value: 'Low', label: 'Low (Nuisance)', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', desc: 'Minor inconvenience, can wait' },
  { value: 'Medium', label: 'Medium (Aesthetic/Struggle)', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', desc: 'Impedes daily neighborhood activities' },
  { value: 'High', label: 'High (Immediate Concern)', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', desc: 'Risks property damage or near-accidents' },
  { value: 'Critical', label: 'Critical (Life Hazard)', bg: 'bg-red-50 border-red-200', text: 'text-red-700', desc: 'Accident risk or extreme threat to community safety' },
];

export default function ReportIssueScreen({
  prefilledCoords,
  prefilledLocationName,
  onGoBack,
  onSubmitReport,
  currentUser,
}: ReportIssueScreenProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Roads');
  const [severity, setSeverity] = useState<Severity>('Medium');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Custom manual coordinate input in case they bypassed the map
  const [latInput, setLatInput] = useState(prefilledCoords ? prefilledCoords[0].toString() : '28.6139');
  const [lngInput, setLngInput] = useState(prefilledCoords ? prefilledCoords[1].toString() : '77.2090');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync with pre-filled inputs
  useEffect(() => {
    if (prefilledCoords) {
      setLatInput(prefilledCoords[0].toString());
      setLngInput(prefilledCoords[1].toString());
    }
    if (prefilledLocationName) {
      setLocationName(prefilledLocationName);
    }
  }, [prefilledCoords, prefilledLocationName]);

  const insertTemplate = (type: 'detailed' | 'simple') => {
    if (type === 'detailed') {
      setDescription(prev => prev + `\n\n### Detailed Observations
- **Specific landmark:** 
- **Time of day/peak impact:** 
- **Estimated width/volume of hazard:** 
- **Urgent warning signs present?** (Yes/No)

### Proposed Immediate Fix
`);
    } else {
      setDescription(prev => prev + `\n\n- **Impact:** 
- **Risk:** 
- **Request:** `);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a descriptive report title.');
      return;
    }
    if (title.length < 5) {
      setFormError('Report title should be at least 5 characters.');
      return;
    }
    if (!locationName.trim()) {
      setFormError('Please describe the location landmark.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a short description of the community hazard.');
      return;
    }

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setFormError('Please enter valid geospatial coordinates.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReport({
        title: title.trim(),
        category,
        severity,
        description: description.trim(),
        coordinates: [lat, lng],
        locationName: locationName.trim(),
        author: isAnonymous ? 'Anonymous Citizen' : currentUser.username,
        authorId: currentUser.userId,
      });

      setSuccess(true);
      setTimeout(() => {
        onGoBack(); // Go back to Map/List
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit the report. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="report-issue-form-wrapper" className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <button
          id="report-form-back-btn"
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          📝 File New Community Grievance
        </h2>
        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
          Civic Portal
        </span>
      </div>

      {success ? (
        <div id="report-success-screen" className="py-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 animate-bounce">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Report Successfully Lodged</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Thank you for participating! Your grievance has been registered on the community registry. Nearby neighbors will be able to upvote and validate it.
          </p>
          <p className="text-xs text-blue-600 animate-pulse mt-2 font-bold uppercase tracking-wider">Redirecting back to platform...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Geospatial Lock Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <MapPin className={`w-5 h-5 mt-0.5 ${prefilledCoords ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  {prefilledCoords ? '📍 Coordinate Pin Locked' : '⚠️ No Live Pin Locked'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                  {prefilledCoords
                    ? `Geo-location locked: Lat ${prefilledCoords[0].toFixed(5)}, Lng ${prefilledCoords[1].toFixed(5)}.`
                    : 'To lock coordinates automatically, drop a pin on the Interactive Map first. Or insert manually below:'}
                </p>
              </div>
            </div>

            {prefilledCoords && (
              <span className="text-[11px] font-bold text-blue-600 uppercase bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md self-start sm:self-center">
                Pre-Filled Link active
              </span>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label id="label-report-title" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Grievance Title <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-slate-500 lowercase">Keep it short & specific</span>
            </label>
            <input
              id="report-title-input"
              type="text"
              required
              placeholder="e.g., Blocked drainage causing severe flood risk"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-4 py-2.5 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition shadow-sm"
            />
          </div>

          {/* Grid Category & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category Select */}
            <div className="space-y-2">
              <label id="label-report-category" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    id={`report-select-cat-${cat.value}`}
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-start gap-3 text-left p-3 rounded-xl border transition cursor-pointer ${
                      category === cat.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{cat.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">{cat.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Picker */}
            <div className="space-y-2">
              <label id="label-report-severity" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {SEVERITIES.map((sev) => (
                  <button
                    id={`report-select-sev-${sev.value}`}
                    key={sev.value}
                    type="button"
                    onClick={() => setSeverity(sev.value)}
                    className={`flex items-start gap-3 text-left p-3 rounded-xl border transition cursor-pointer ${
                      severity === sev.value
                        ? `${sev.bg} border-blue-500 text-slate-900 shadow-sm`
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${sev.value === 'Critical' ? 'bg-red-500 animate-ping' : sev.value === 'High' ? 'bg-orange-500' : sev.value === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{sev.label}</div>
                      <div className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">{sev.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Landmark & Manual Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            {/* Landmark Name */}
            <div className="space-y-1.5">
              <label id="label-report-location" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Landmarked Location <span className="text-red-500">*</span>
              </label>
              <input
                id="report-location-input"
                type="text"
                required
                placeholder="e.g., Gate 2, near Connaught Circle Metro Hub"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-4 py-2.5 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition shadow-sm"
              />
            </div>

            {/* Manual Lat/Lng coordinates override */}
            <div className="space-y-1.5">
              <label id="label-report-coordinates" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Manual Coordinates override (optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-mono">Latitude</span>
                  <input
                    id="report-lat-override"
                    type="number"
                    step="any"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-3 py-2 rounded-xl text-slate-800 text-xs font-mono shadow-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-mono">Longitude</span>
                  <input
                    id="report-lng-override"
                    type="number"
                    step="any"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-3 py-2 rounded-xl text-slate-800 text-xs font-mono shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description & Markdown Helpers */}
          <div className="space-y-2 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label id="label-report-description" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description & Impact Context <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Insert Template:</span>
                <button
                  id="insert-template-simple"
                  type="button"
                  onClick={() => insertTemplate('simple')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                >
                  Quick Core
                </button>
                <button
                  id="insert-template-detailed"
                  type="button"
                  onClick={() => insertTemplate('detailed')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                >
                  Detailed Grid
                </button>
              </div>
            </div>

            <textarea
              id="report-description-textarea"
              rows={6}
              required
              placeholder="State the problem, safety risks, and what immediate fix is needed. You may use markdown structures if desired..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-4 py-3 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition font-sans resize-y leading-relaxed shadow-sm"
            />
          </div>

          {/* Submission settings */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <input
                id="anonymous-toggle"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300 cursor-pointer"
              />
              <label htmlFor="anonymous-toggle" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                File this report anonymously
              </label>
            </div>

            {!isAnonymous && (
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Filing as <strong className="text-blue-600 font-bold">{currentUser.username}</strong>
              </span>
            )}
          </div>

          {/* Feedback/Error Panel */}
          {formError && (
            <div id="report-error-alert" className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              id="report-form-cancel-btn"
              type="button"
              onClick={onGoBack}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              Cancel
            </button>
            <button
              id="report-form-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Registering...' : 'Lodge Report'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
