/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { CommunityReport, Badge } from '../types';
import { Award, ShieldAlert, CheckSquare, Edit, Save, Calendar, ThumbsUp, MessageSquare, Landmark, Sparkles } from 'lucide-react';

interface UserProfileScreenProps {
  reports: CommunityReport[];
  currentUser: { username: string; userId: string };
  onUpdateUsername: (newUsername: string) => void;
  onSelectReport: (id: string) => void;
}

interface Milestones {
  filedCount: number;
  commentsCount: number;
  upvotesReceived: number;
  resolutionsCount: number;
  points: number;
}

export default function UserProfileScreen({
  reports,
  currentUser,
  onUpdateUsername,
  onSelectReport,
}: UserProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(currentUser.username);

  // 1. Filter reports filed by the active citizen
  const userReports = useMemo(() => {
    return reports.filter(r => r.authorId === currentUser.userId);
  }, [reports, currentUser.userId]);

  // 2. Compute user stats for gamification
  const stats = useMemo<Milestones>(() => {
    const filedCount = userReports.length;

    // Comments contributed by user across all reports
    let commentsCount = 0;
    reports.forEach(r => {
      r.comments.forEach(c => {
        if (c.authorId === currentUser.userId) {
          commentsCount++;
        }
      });
    });

    // Total upvotes received on reports filed by user
    const upvotesReceived = userReports.reduce((acc, curr) => acc + curr.upvotes, 0);

    // Number of user's filed reports that are resolved
    const resolutionsCount = userReports.filter(r => r.status === 'Resolved').length;

    // Gamification Points Calculation:
    // Filing: 15 pts, Commenting: 5 pts, Upvote received: 10 pts, Resolution achieved: 30 pts
    const points = (filedCount * 15) + (commentsCount * 5) + (upvotesReceived * 10) + (resolutionsCount * 30);

    return {
      filedCount,
      commentsCount,
      upvotesReceived,
      resolutionsCount,
      points,
    };
  }, [reports, userReports, currentUser.userId]);

  // 3. Evaluate unlocked civic badges
  const badgesList = useMemo(() => {
    const badges: { name: string; desc: string; icon: string; tier: 'Bronze' | 'Silver' | 'Gold'; isUnlocked: boolean }[] = [
      {
        name: "First Responder",
        desc: "Filed your first community grievance on the Civic registry.",
        icon: "🚨",
        tier: "Bronze",
        isUnlocked: stats.filedCount >= 1
      },
      {
        name: "Civic Sentinel",
        desc: "Filed 3 or more localized community reports.",
        icon: "🛡️",
        tier: "Silver",
        isUnlocked: stats.filedCount >= 3
      },
      {
        name: "Vocal Neighbor",
        desc: "Contributed 3 or more helpful comments or verification checks.",
        icon: "🗣️",
        tier: "Bronze",
        isUnlocked: stats.commentsCount >= 3
      },
      {
        name: "Community Anchor",
        desc: "Earned 50+ total gamification points through collective actions.",
        icon: "⚓",
        tier: "Gold",
        isUnlocked: stats.points >= 50
      },
      {
        name: "Ward Partner",
        desc: "Helped resolve and successfully close at least 1 community issue.",
        icon: "🤝",
        tier: "Silver",
        isUnlocked: stats.resolutionsCount >= 1
      },
      {
        name: "Citizen Expert",
        desc: "Earned 150+ total points representing absolute elite municipal cooperation.",
        icon: "👑",
        tier: "Gold",
        isUnlocked: stats.points >= 150
      }
    ];

    return badges;
  }, [stats]);

  const handleSaveUsername = () => {
    if (usernameInput.trim() && usernameInput.trim().length >= 3) {
      onUpdateUsername(usernameInput.trim());
      setIsEditing(false);
    }
  };

  return (
    <div id="user-profile-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Profile Config Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4.5 flex-col md:flex-row text-center md:text-left">
          {/* Avatar Icon */}
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl shadow-sm">
            🏅
          </div>

          <div className="space-y-1.5 font-bold">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  id="profile-username-input"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="bg-white border border-slate-250 text-slate-800 text-sm font-bold px-3 py-1 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  id="profile-save-username-btn"
                  onClick={handleSaveUsername}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                  title="Save Profile Name"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h2 className="text-lg font-black text-slate-800">{currentUser.username}</h2>
                <button
                  id="profile-edit-username-btn"
                  onClick={() => setIsEditing(true)}
                  className="text-slate-450 hover:text-slate-700 transition cursor-pointer"
                  title="Edit Profile Name"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 justify-center md:justify-start">
              <span>Citizen UID: {currentUser.userId}</span>
              <span>•</span>
              <span className="text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Active Contributor
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic score summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center px-8 shadow-inner min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Civic Score Balance</span>
          <div className="text-3xl font-black text-blue-600 mt-1">{stats.points}</div>
          <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Points earned</p>
        </div>
      </div>

      {/* Grid: Stats & Unlocked Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gamification Milestones Stats */}
        <div className="lg:col-span-1 space-y-6 font-bold">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Landmark className="w-4 h-4 text-blue-600" /> Milestone Audit
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-500 font-bold">Grievances Logged</span>
                <span className="font-bold text-slate-700">{stats.filedCount}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-500 font-bold">Comments & Verifications</span>
                <span className="font-bold text-slate-700">{stats.commentsCount}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-500 font-bold">Received backing</span>
                <span className="font-bold text-slate-700">👍 {stats.upvotesReceived}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-500 font-bold">Resolutions Achieved</span>
                <span className="font-bold text-emerald-600">✔️ {stats.resolutionsCount}</span>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-[10px] text-slate-600 leading-normal font-medium">
              <span className="font-bold text-blue-600">Point Guide:</span> Filing a report grants <strong className="text-blue-750 font-bold">15 pts</strong>, comments grant <strong className="text-blue-750 font-bold">5 pts</strong>, upvotes grant <strong className="text-blue-750 font-bold">10 pts</strong>, and resolving an issue awards <strong className="text-blue-750 font-bold">30 pts</strong>!
            </div>
          </div>
        </div>

        {/* Right Column: Badges (Col-span 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-blue-600 animate-pulse" /> Unlocked Civic Accolades
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badgesList.map((badge) => (
              <div
                id={`badge-card-${badge.name.toLowerCase().replace(/\s+/g, '-')}`}
                key={badge.name}
                className={`border p-4 rounded-xl flex gap-3 transition-all ${
                  badge.isUnlocked
                    ? 'bg-slate-50 border-slate-200 shadow-sm'
                    : 'bg-slate-100/40 border-slate-200 opacity-40 select-none'
                }`}
              >
                <div className="text-3xl shrink-0 self-center">{badge.icon}</div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-700">{badge.name}</h4>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      badge.tier === 'Gold' ? 'bg-yellow-50 text-yellow-600 border border-yellow-250' :
                      badge.tier === 'Silver' ? 'bg-slate-50 text-slate-550 border border-slate-200' :
                      'bg-orange-50 text-orange-600 border border-orange-250'
                    }`}>
                      {badge.tier}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">{badge.desc}</p>
                  
                  {badge.isUnlocked ? (
                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 uppercase tracking-wider">
                      ✓ Accolade Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-450 flex items-center gap-0.5 uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citizen Personal Activity Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <CheckSquare className="w-4 h-4 text-blue-600" /> Personal Grievance activity ledger
        </h3>

        {userReports.length === 0 ? (
          <p id="ledger-empty" className="text-xs text-slate-400 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
            You have not filed any public grievances under this username yet. Go to the map or registry to lodge your first issue!
          </p>
        ) : (
          <div id="ledger-list" className="space-y-3.5">
            {userReports.map(report => (
              <div
                id={`ledger-item-${report.id}`}
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-4 rounded-xl cursor-pointer transition flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors">{report.title}</span>
                    <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-md">
                      {report.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <Calendar className="w-3 h-3" /> Logged on {new Date(report.createdAt).toLocaleDateString()} at {report.locationName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    <ThumbsUp className="w-3 h-3 text-blue-600" /> {report.upvotes}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    <MessageSquare className="w-3 h-3 text-blue-600" /> {report.comments.length}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    report.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                    report.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-250' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
