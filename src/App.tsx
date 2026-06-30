/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CommunityReport, Category, Severity, IssueStatus } from './types';
import MapScreen from './components/MapScreen';
import AllReportsScreen from './components/AllReportsScreen';
import ReportIssueScreen from './components/ReportIssueScreen';
import IssueDetailScreen from './components/IssueDetailScreen';
import ImpactDashboardScreen from './components/ImpactDashboardScreen';
import AiHubScreen from './components/AiHubScreen';
import UserProfileScreen from './components/UserProfileScreen';
import { 
  Map, ClipboardList, PlusCircle, BarChart3, 
  MessageSquare, UserCircle, Landmark, BellRing, Sparkles 
} from 'lucide-react';

type Tab = 'map' | 'registry' | 'report' | 'analytics' | 'ai' | 'profile';

export default function App() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // Geospatial coordinate pre-fill states
  const [prefilledCoords, setPrefilledCoords] = useState<[number, number] | null>(null);
  const [prefilledLocationName, setPrefilledLocationName] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);

  // Simulated Client User Profile
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('civic_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    const randomId = `usr-${Math.floor(1000 + Math.random() * 9000)}`;
    return { username: 'Aarav Sharma', userId: randomId };
  });

  // Fetch all reports on mount and when tab changes
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to sync with civic registry', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Update Username Profile helper
  const handleUpdateUsername = (newUsername: string) => {
    const updated = { ...currentUser, username: newUsername };
    setCurrentUser(updated);
    localStorage.setItem('civic_user', JSON.stringify(updated));
  };

  // Upvote API Trigger
  const handleUpvote = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId }),
      });

      if (res.ok) {
        const data = await res.json();
        setReports(prev => 
          prev.map(r => r.id === reportId ? { ...r, upvotes: data.upvotes, upvotedBy: data.upvotedBy } : r)
        );
      }
    } catch (err) {
      console.error('Failed to trigger upvote backing', err);
    }
  };

  // Comment API Trigger
  const handlePostComment = async (
    reportId: string, 
    commentData: { author: string; authorId: string; content: string; coordinates?: [number, number] }
  ) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      if (res.ok) {
        const newComment = await res.json();
        setReports(prev => 
          prev.map(r => r.id === reportId ? { ...r, comments: [...r.comments, newComment] } : r)
        );
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  // Status/Lifecycle Change API Trigger
  const handleUpdateStatus = async (
    reportId: string, 
    statusData: { status: IssueStatus; comment: string; updatedBy: string }
  ) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData),
      });

      if (res.ok) {
        const updatedReport = await res.json();
        setReports(prev => 
          prev.map(r => r.id === reportId ? updatedReport : r)
        );
      }
    } catch (err) {
      console.error('Failed to update report status', err);
    }
  };

  // Smart Form Pre-fill lock-in action from map view
  const handleInitiateReport = (lat: number, lng: number, locationName: string) => {
    setPrefilledCoords([lat, lng]);
    setPrefilledLocationName(locationName);
    setActiveTab('report');
  };

  // Smart Form submission API trigger
  const handleFormSubmitReport = async (reportData: {
    title: string;
    category: Category;
    severity: Severity;
    description: string;
    coordinates: [number, number];
    locationName: string;
    author: string;
    authorId: string;
  }) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to submit report');
    }

    const newReport = await res.json();
    setReports(prev => [newReport, ...prev]);

    // Reset prefilled states
    setPrefilledCoords(null);
    setPrefilledLocationName('');
  };

  // Selected Inspect Report Object
  const selectedReport = reports.find(r => r.id === selectedReportId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[2000] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-slate-800">CIVIC.FLOW <span className="text-blue-600">HQ</span></h1>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-0.5">
                  <BellRing className="w-2.5 h-2.5 animate-pulse" /> Live
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborative Citizen Resolution Platform</p>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
            <button
              id="tab-btn-map"
              onClick={() => { setActiveTab('map'); setSelectedReportId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'map' && !selectedReportId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Community Map
            </button>

            <button
              id="tab-btn-registry"
              onClick={() => { setActiveTab('registry'); setSelectedReportId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'registry' && !selectedReportId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> All Reports
            </button>

            <button
              id="tab-btn-report"
              onClick={() => { setActiveTab('report'); setSelectedReportId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'report' && !selectedReportId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> File Issue
            </button>

            <button
              id="tab-btn-analytics"
              onClick={() => { setActiveTab('analytics'); setSelectedReportId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics' && !selectedReportId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Impact Dashboard
            </button>

            <button
              id="tab-btn-ai"
              onClick={() => { setActiveTab('ai'); setSelectedReportId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ai' && !selectedReportId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Gemini AI Hub
            </button>

            <button
              id="tab-btn-profile"
              onClick={() => { setActiveTab('profile'); setSelectedReportId(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'profile' && !selectedReportId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <UserCircle className="w-3.5 h-3.5" /> My Profile
            </button>
          </nav>
        </div>
      </header>

      {/* Main Screen Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-bold animate-pulse">Syncing with Municipal Registry...</p>
          </div>
        ) : selectedReportId && selectedReport ? (
          // Timeline Report Detail Inspect Screen overrides active tab view when active
          <IssueDetailScreen
            report={selectedReport}
            onGoBack={() => setSelectedReportId(null)}
            onUpvote={handleUpvote}
            onPostComment={handlePostComment}
            onUpdateStatus={handleUpdateStatus}
            currentUser={currentUser}
          />
        ) : (
          // Active Screen Tab routing
          <div>
            {activeTab === 'map' && (
              <MapScreen
                reports={reports}
                onSelectReport={(id) => setSelectedReportId(id)}
                onInitiateReport={handleInitiateReport}
              />
            )}

            {activeTab === 'registry' && (
              <AllReportsScreen
                reports={reports}
                onSelectReport={(id) => setSelectedReportId(id)}
                onNavigateToReportForm={() => setActiveTab('report')}
              />
            )}

            {activeTab === 'report' && (
              <ReportIssueScreen
                prefilledCoords={prefilledCoords}
                prefilledLocationName={prefilledLocationName}
                onGoBack={() => {
                  setActiveTab('map');
                  setPrefilledCoords(null);
                  setPrefilledLocationName('');
                }}
                onSubmitReport={handleFormSubmitReport}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'analytics' && (
              <ImpactDashboardScreen reports={reports} />
            )}

            {activeTab === 'ai' && (
              <AiHubScreen />
            )}

            {activeTab === 'profile' && (
              <UserProfileScreen
                reports={reports}
                currentUser={currentUser}
                onUpdateUsername={handleUpdateUsername}
                onSelectReport={(id) => setSelectedReportId(id)}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
        <p>© 2026 CIVIC.FLOW HQ. Empowering citizens through transparency and collective resolution.</p>
      </footer>
    </div>
  );
}
