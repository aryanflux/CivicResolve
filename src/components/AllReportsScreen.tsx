/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CommunityReport, Category, Severity, IssueStatus } from '../types';
import { Search, Filter, MessageSquare, ThumbsUp, MapPin, Calendar, Check, AlertCircle } from 'lucide-react';

interface AllReportsScreenProps {
  reports: CommunityReport[];
  onSelectReport: (id: string) => void;
  onNavigateToReportForm: () => void;
}

const CATEGORIES: Category[] = ['Roads', 'Waste', 'Lighting', 'Water', 'Other'];
const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: IssueStatus[] = ['Pending', 'Under Investigation', 'In Progress', 'Resolved'];

const CATEGORY_EMOJIS: Record<Category, string> = {
  Roads: '🕳️',
  Waste: '🗑️',
  Lighting: '💡',
  Water: '🚰',
  Other: '⚠️',
};

const SEVERITY_STYLES: Record<Severity, { border: string; bg: string; text: string }> = {
  Critical: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' },
  High: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700' },
  Medium: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  Low: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const STATUS_STYLES: Record<IssueStatus, { bg: string; text: string; dot: string }> = {
  Pending: { bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-700', dot: 'bg-red-500' },
  'Under Investigation': { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  'In Progress': { bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
  Resolved: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
};

export default function AllReportsScreen({ reports, onSelectReport, onNavigateToReportForm }: AllReportsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes'>('newest');

  // Toggle Filters
  const toggleCategory = (cat: Category) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSeverity = (sev: Severity) => {
    setSelectedSeverities(prev => 
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    );
  };

  const toggleStatus = (stat: IssueStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(stat) ? prev.filter(s => s !== stat) : [...prev, stat]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSeverities([]);
    setSelectedStatuses([]);
    setSearchQuery('');
  };

  // Filter & Sort Logic
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(report.category);
    const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(report.severity);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(report.status);

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'upvotes') {
      return b.upvotes - a.upvotes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div id="all-reports-screen" className="flex flex-col lg:flex-row gap-6">
      {/* Left Column: Filter Sidebar */}
      <div id="filters-sidebar" className="w-full lg:w-72 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-5 self-start shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" /> Filter Registry
          </span>
          {(selectedCategories.length > 0 || selectedSeverities.length > 0 || selectedStatuses.length > 0 || searchQuery) && (
            <button
              id="clear-filters-btn"
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Filter Category */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Category</h4>
          <div className="flex flex-col gap-1.5">
            {CATEGORIES.map(cat => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  id={`filter-category-${cat}`}
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{CATEGORY_EMOJIS[cat]}</span>
                    <span>{cat}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Severity */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Severity</h4>
          <div className="flex flex-col gap-1.5">
            {SEVERITIES.map(sev => {
              const active = selectedSeverities.includes(sev);
              return (
                <button
                  id={`filter-severity-${sev}`}
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={`flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sev === 'Critical' ? 'bg-red-500' : sev === 'High' ? 'bg-orange-500' : sev === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                    <span>{sev}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Status */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Progress Stage</h4>
          <div className="flex flex-col gap-1.5">
            {STATUSES.map(stat => {
              const active = selectedStatuses.includes(stat);
              return (
                <button
                  id={`filter-status-${stat}`}
                  key={stat}
                  onClick={() => toggleStatus(stat)}
                  className={`flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span>{stat}</span>
                  {active && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Search + Grid */}
      <div id="registry-grid-container" className="flex-grow flex flex-col gap-5">
        {/* Search, Sort and Call to Action */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="registry-search-input"
              type="text"
              placeholder="Search by title, location, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none pl-11 pr-4 py-2.5 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider">Sort:</span>
            <select
              id="registry-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="newest">Newest Logged</option>
              <option value="upvotes">Upvotes (Most Backed)</option>
            </select>

            <button
              id="nav-to-report-from-registry"
              onClick={onNavigateToReportForm}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              + File Issue
            </button>
          </div>
        </div>

        {/* Dynamic Status Indicators */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Found <strong className="text-slate-700">{filteredReports.length}</strong> matching community reports</span>
        </div>

        {/* Reports Cards Grid */}
        {filteredReports.length === 0 ? (
          <div id="no-reports-empty" className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-400" />
            <h3 className="font-bold text-slate-700">No Civic Issues Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">No logged community issues match your search query or filter matrix parameters. Try widening your criteria or file a new report!</p>
            <button
              id="clear-filters-btn-empty"
              onClick={clearAllFilters}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-slate-300 px-4 py-1.5 rounded-lg transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div id="reports-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => {
              const sev = SEVERITY_STYLES[report.severity];
              const stat = STATUS_STYLES[report.status];
              const emoji = CATEGORY_EMOJIS[report.category] || '⚠️';

              return (
                <div
                  id={`report-card-${report.id}`}
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className="bg-white hover:border-slate-300 border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-4 group shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xl bg-slate-50 w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">{emoji}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${sev.border} ${sev.bg} ${sev.text}`}>
                          {report.severity}
                        </span>
                        <span className="text-xs text-slate-500 font-bold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                          {report.category}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${stat.bg} ${stat.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                        {report.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1 text-sm">
                        {report.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex-wrap gap-2 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="line-clamp-1 font-bold">{report.locationName}</span>
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600">
                        <ThumbsUp className="w-3 h-3 text-blue-600" />
                        {report.upvotes} backing
                      </span>

                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {report.comments.length}
                      </span>

                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
