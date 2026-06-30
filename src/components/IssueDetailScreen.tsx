/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { CommunityReport, Comment, IssueStatus, Severity, Category } from '../types';
import L from 'leaflet';
import { 
  ArrowLeft, ThumbsUp, MessageSquare, Clock, MapPin, 
  Send, User, AlertCircle, ShieldAlert, CheckCircle, 
  Briefcase, Wrench, ChevronRight, CheckSquare
} from 'lucide-react';

interface IssueDetailScreenProps {
  report: CommunityReport;
  onGoBack: () => void;
  onUpvote: (id: string) => Promise<any>;
  onPostComment: (id: string, commentData: { author: string; authorId: string; content: string; coordinates?: [number, number] }) => Promise<any>;
  onUpdateStatus: (id: string, statusData: { status: IssueStatus; comment: string; updatedBy: string }) => Promise<any>;
  currentUser: { username: string; userId: string };
}

const CATEGORY_EMOJIS: Record<Category, string> = {
  Roads: '🕳️',
  Waste: '🗑️',
  Lighting: '💡',
  Water: '🚰',
  Other: '⚠️',
};

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', border: 'border-red-200' },
  High: { bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700', border: 'border-orange-200' },
  Medium: { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-700', border: 'border-yellow-200' },
  Low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const STATUS_INFO: Record<IssueStatus, { label: string; bg: string; text: string; icon: any; desc: string }> = {
  Pending: { label: 'Pending Registry', bg: 'bg-red-50 border-red-250 text-red-700', text: 'text-red-700', icon: AlertCircle, desc: 'Logged by citizen and waiting for verification or upvotes.' },
  'Under Investigation': { label: 'Under Investigation', bg: 'bg-amber-50 border-amber-250 text-amber-700', text: 'text-amber-700', icon: Clock, desc: 'Field inspector checking credentials, coordinates, and load sizes.' },
  'In Progress': { label: 'In Progress / Assigned', bg: 'bg-blue-50 border-blue-250 text-blue-700', text: 'text-blue-700', icon: Wrench, desc: 'Assigned to municipal engineers or local contractors. Work commenced.' },
  Resolved: { label: 'Resolved & Closed', bg: 'bg-emerald-50 border-emerald-250 text-emerald-700', text: 'text-emerald-700', icon: CheckCircle, desc: 'Work completed, verified by field tests and coordinate checklists.' },
};

export default function IssueDetailScreen({
  report,
  onGoBack,
  onUpvote,
  onPostComment,
  onUpdateStatus,
  currentUser,
}: IssueDetailScreenProps) {
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);

  const [commentContent, setCommentContent] = useState('');
  const [isSiteVerified, setIsSiteVerified] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Admin / Investigator Simulation Toggles
  const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(report.status);
  const [adminComment, setAdminComment] = useState('');
  const [adminRole, setAdminRole] = useState('Ward Inspector');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const hasUpvoted = report.upvotedBy.includes(currentUser.userId);

  // Initialize mini map for the report coordinates
  useEffect(() => {
    if (!miniMapContainerRef.current || miniMapRef.current) return;

    const map = L.map(miniMapContainerRef.current, {
      center: report.coordinates,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });
    miniMapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    const emoji = CATEGORY_EMOJIS[report.category] || '⚠️';

    const iconHtml = `
      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white shadow-md text-sm select-none">
        ${emoji}
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'mini-map-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker(report.coordinates, { icon: customIcon }).addTo(map);

    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, [report]);

  const handleUpvoteClick = async () => {
    try {
      await onUpvote(report.id);
    } catch (err) {
      console.error("Failed to upvote", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsPostingComment(true);
    try {
      // Simulate slightly offset coordinates for verified site confirmations
      const verifiedCoords: [number, number] | undefined = isSiteVerified 
        ? [report.coordinates[0] + (Math.random() - 0.5) * 0.0001, report.coordinates[1] + (Math.random() - 0.5) * 0.0001]
        : undefined;

      await onPostComment(report.id, {
        author: currentUser.username,
        authorId: currentUser.userId,
        content: commentContent.trim(),
        coordinates: verifiedCoords,
      });

      setCommentContent('');
      setIsSiteVerified(false);
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminComment.trim()) return;

    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(report.id, {
        status: selectedStatus,
        comment: adminComment.trim(),
        updatedBy: `${currentUser.username} (${adminRole})`,
      });
      setAdminComment('');
      setShowStatusUpdateForm(false);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const activeStatus = STATUS_INFO[report.status];
  const ActiveStatusIcon = activeStatus.icon;

  return (
    <div id={`issue-detail-screen-${report.id}`} className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          id="detail-back-btn"
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </button>

        <div className="flex items-center gap-3">
          <button
            id={`detail-upvote-btn-${report.id}`}
            onClick={handleUpvoteClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-sm ${
              hasUpvoted
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-blue-600 text-blue-600' : ''}`} />
            {hasUpvoted ? 'Upvoted (Backed!)' : 'Upvote Issue'}
            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] ml-1">{report.upvotes}</span>
          </button>

          <button
            id="simulate-status-toggle"
            onClick={() => setShowStatusUpdateForm(!showStatusUpdateForm)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
          >
            🔧 Change Status (Simulate)
          </button>
        </div>
      </div>

      {/* Grid: Main details + Sidebar Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Primary issue metadata */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl">{CATEGORY_EMOJIS[report.category]}</span>
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${SEVERITY_STYLES[report.severity].border} ${SEVERITY_STYLES[report.severity].bg} ${SEVERITY_STYLES[report.severity].text}`}>
                  {report.severity} Urgency
                </span>
                <span className="text-xs text-slate-600 font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                  {report.category}
                </span>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${activeStatus.bg} ${activeStatus.text}`}>
                <ActiveStatusIcon className="w-3.5 h-3.5" />
                {activeStatus.label}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-lg md:text-xl font-bold text-slate-800">{report.title}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-700">{report.locationName}</span>
                <span className="text-slate-300">•</span>
                <span>Filed by {report.author}</span>
                <span className="text-slate-300">•</span>
                <span>{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description & Case Detail</h4>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-100 p-4 rounded-xl font-medium">
                {report.description}
              </div>
            </div>
          </div>

          {/* Status Progression Timeline & Change Log */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Administrative Lifecycle History
            </h3>

            {/* Linear Progress Bar */}
            <div className="grid grid-cols-4 gap-2 relative border-b border-slate-100 pb-5">
              {(['Pending', 'Under Investigation', 'In Progress', 'Resolved'] as IssueStatus[]).map((statusStep, index) => {
                const stepInfo = STATUS_INFO[statusStep];
                const StepIcon = stepInfo.icon;
                const isCurrent = report.status === statusStep;
                
                // Determine if this step is completed
                const order = ['Pending', 'Under Investigation', 'In Progress', 'Resolved'];
                const currentIndex = order.indexOf(report.status);
                const stepIndex = order.indexOf(statusStep);
                const isDone = stepIndex <= currentIndex;

                return (
                  <div key={statusStep} className="flex flex-col items-center text-center gap-1.5 relative">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCurrent ? 'bg-blue-600 border-blue-500 text-white shadow-md' :
                      isDone ? 'bg-blue-50 border-blue-200 text-blue-600' :
                      'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-600 font-bold' : isDone ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>
                      {statusStep}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timeline Events List */}
            <div className="flow-root mt-4">
              <ul className="-mb-8">
                {report.statusHistory.map((history, idx) => (
                  <li key={history.id}>
                    <div className="relative pb-8">
                      {idx !== report.statusHistory.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3 items-start">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs">
                            ⚙️
                          </span>
                        </div>
                        <div className="flex-grow min-w-0 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs font-bold text-slate-700">
                              Transitioned to <strong className="text-blue-600 font-bold">{history.toStatus}</strong>
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(history.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 italic font-medium">
                            "{history.comment}"
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 font-bold flex items-center gap-1 uppercase tracking-wider">
                            <User className="w-3 h-3" /> Updated by {history.updatedBy}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar: Map and Quick Stats (Col-span 1) */}
        <div className="space-y-6">
          {/* Card: Mini Map Locator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Geospatial Location
            </h3>
            
            {/* Map Container */}
            <div ref={miniMapContainerRef} className="w-full h-40 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden relative" />
            
            <div className="text-[11px] text-slate-500 font-mono flex flex-col gap-1 font-bold">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Latitude:</span>
                <span className="text-slate-700">{report.coordinates[0].toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span>Longitude:</span>
                <span className="text-slate-700">{report.coordinates[1].toFixed(5)}</span>
              </div>
            </div>
          </div>

          {/* Card: Backing & Urgency Statistics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Grievance Health</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Backing Level</span>
                <div className="text-lg font-bold text-blue-600 mt-1">👍 {report.upvotes}</div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Severity tier</span>
                <div className="text-xs font-bold text-slate-700 mt-2">{report.severity}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
              <span className="font-bold text-blue-600">Resolution SLA:</span> {report.severity === 'Critical' ? 'Critical tier concerns are assigned with immediate dispatch (< 24 hours)' : report.severity === 'High' ? 'High urgency cases are routed within 48 hours.' : 'Standard investigation queue within 5 days.'}
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Update Status Modal/Form Panel */}
      {showStatusUpdateForm && (
        <div id="status-update-simulation-form" className="bg-white border-2 border-blue-500/30 p-6 rounded-2xl shadow-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm uppercase tracking-wider">
              🔧 Simulation: Transition Administrative Stage
            </h3>
            <button
              id="close-status-form-btn"
              onClick={() => setShowStatusUpdateForm(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleStatusSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Status Pick */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Select Stage Transition</label>
              <select
                id="simulate-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option value="Pending">Pending Registry</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved (Close Case)</option>
              </select>
            </div>

            {/* Role Pick */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Simulate Officer Role</label>
              <select
                id="simulate-role-select"
                value={adminRole}
                onChange={(e) => setAdminRole(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option value="Ward Inspector">Ward Inspector</option>
                <option value="Municipal Engineer">Municipal Engineer</option>
                <option value="Citizen Representative">Citizen Representative</option>
                <option value="Sanitation Lead">Sanitation Lead</option>
              </select>
            </div>

            {/* Comment Log */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Administrative Transition Note</label>
              <textarea
                id="simulate-status-comment"
                required
                placeholder="Write specific notes about work dispatched, materials, testing results, or reasons for resolution..."
                rows={3}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs p-3 rounded-xl focus:outline-none focus:border-blue-500 font-medium shadow-sm"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                id="status-form-submit-btn"
                type="submit"
                disabled={isUpdatingStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isUpdatingStatus ? 'Transitioning...' : 'Confirm Stage Change'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Card: Community Comment Thread */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" /> Community Discussion & Verification
        </h3>

        {/* Comment Thread */}
        <div id="comments-thread-list" className="space-y-4">
          {report.comments.length === 0 ? (
            <p id="no-comments-empty" className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
              No verification notes or updates have been posted by nearby neighbors yet. Be the first to validate this report!
            </p>
          ) : (
            report.comments.map((comment) => (
              <div
                id={`comment-card-${comment.id}`}
                key={comment.id}
                className={`border p-4 rounded-xl flex flex-col gap-2 ${
                  comment.coordinates 
                    ? 'bg-blue-50/50 border-blue-200 shadow-sm shadow-blue-500/5' 
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {comment.author[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase bg-blue-50 px-1.5 py-0.5 rounded ml-2">Neighbor</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-9 leading-relaxed font-medium">
                  {comment.content}
                </p>

                {comment.coordinates && (
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100 py-1 px-2 rounded-lg self-start ml-9 mt-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>📍 Coords Verified On-Site: Lat {comment.coordinates[0].toFixed(5)}, Lng {comment.coordinates[1].toFixed(5)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleCommentSubmit} className="space-y-3 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <textarea
              id="comment-textarea-input"
              rows={3}
              placeholder="Write an update, provide on-site feedback, or coordinate with neighbors..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-4 py-2.5 rounded-xl text-slate-850 text-xs placeholder-slate-400 font-medium transition shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input
                id="comment-coords-verification-toggle"
                type="checkbox"
                checked={isSiteVerified}
                onChange={(e) => setIsSiteVerified(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 cursor-pointer"
              />
              <label htmlFor="comment-coords-verification-toggle" className="text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Confirm on-site (Verify coordinate lock)
              </label>
            </div>

            <button
              id="comment-submit-btn"
              type="submit"
              disabled={isPostingComment || !commentContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              Post Reply <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
