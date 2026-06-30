/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { CommunityReport, Category, Severity, IssueStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { 
  Activity, CheckCircle2, AlertTriangle, Users, 
  TrendingUp, BarChart3, Clock, MapPin 
} from 'lucide-react';

interface ImpactDashboardScreenProps {
  reports: CommunityReport[];
}

const CATEGORY_COLORS: Record<Category, string> = {
  Roads: '#f59e0b',    // Amber
  Waste: '#10b981',    // Emerald
  Lighting: '#3b82f6', // Blue
  Water: '#06b6d4',    // Cyan
  Other: '#6366f1',    // Indigo
};

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: '#ef4444', // Red
  High: '#f97316',     // Orange
  Medium: '#eab308',   // Yellow
  Low: '#10b981',      // Emerald
};

const STATUS_COLORS: Record<IssueStatus, string> = {
  Pending: '#f43f5e',             // Rose
  'Under Investigation': '#f59e0b', // Amber
  'In Progress': '#0ea5e9',         // Sky
  Resolved: '#10b981',            // Emerald
};

export default function ImpactDashboardScreen({ reports }: ImpactDashboardScreenProps) {
  
  // 1. Calculate Core Civic KPI Metrics dynamically
  const metrics = useMemo(() => {
    const total = reports.length;
    if (total === 0) {
      return {
        totalGrievances: 0,
        resolvedGrievances: 0,
        resolutionRate: 0,
        averageUpvotes: 0,
        activeQueue: 0,
      };
    }

    const resolved = reports.filter(r => r.status === 'Resolved').length;
    const rate = Math.round((resolved / total) * 100);
    
    const sumUpvotes = reports.reduce((acc, curr) => acc + curr.upvotes, 0);
    const avgUpvotes = Math.round((sumUpvotes / total) * 10) / 10;
    
    const active = reports.filter(r => r.status === 'In Progress' || r.status === 'Under Investigation').length;

    return {
      totalGrievances: total,
      resolvedGrievances: resolved,
      resolutionRate: rate,
      averageUpvotes: avgUpvotes,
      activeQueue: active,
    };
  }, [reports]);

  // 2. Format Category Distribution Data
  const categoryData = useMemo(() => {
    const counts: Record<Category, number> = {
      Roads: 0,
      Waste: 0,
      Lighting: 0,
      Water: 0,
      Other: 0,
    };

    reports.forEach(r => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      } else {
        counts.Other++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: CATEGORY_COLORS[name as Category],
    }));
  }, [reports]);

  // 3. Format Severity Load Data
  const severityData = useMemo(() => {
    const counts: Record<Severity, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    reports.forEach(r => {
      if (counts[r.severity] !== undefined) {
        counts[r.severity]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [reports]);

  // 4. Format Status Load Data
  const statusData = useMemo(() => {
    const counts: Record<IssueStatus, number> = {
      Pending: 0,
      'Under Investigation': 0,
      'In Progress': 0,
      Resolved: 0,
    };

    reports.forEach(r => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [reports]);

  // Custom tooltips to blend beautifully with the light layout
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs font-semibold font-sans">
          <p className="text-slate-400 mb-1 uppercase tracking-wide text-[10px]">{label || payload[0].name}</p>
          <p className="text-slate-700 flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].payload.fill || '#3b82f6' }} />
            Reports: <strong className="text-slate-850">{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="impact-dashboard" className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            📊 Visual Analytics Suite & Resolution Rates
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Aggregated municipal health insights, citizen backing volumes, and resolving speed.</p>
        </div>
        
        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Live Community Analytics
        </span>
      </div>

      {/* KPI Matrix Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-bold uppercase">
        {/* Metric 1 */}
        <div id="kpi-total-logged" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Filed</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{metrics.totalGrievances}</div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-bold normal-case font-sans">Logged citizen cases</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div id="kpi-resolution-rate" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resolution Rate</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{metrics.resolutionRate}%</div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-bold normal-case font-sans">{metrics.resolvedGrievances} resolved</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div id="kpi-backing-index" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center text-yellow-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Backing</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{metrics.averageUpvotes}</div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-bold normal-case font-sans">Upvotes per report</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div id="kpi-active-queue" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Queue</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{metrics.activeQueue}</div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-bold normal-case font-sans">Under active fix</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Distribution */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Category Workload Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">By volume</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Category Legend */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 font-bold">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center gap-1.5 justify-center bg-slate-50 p-1.5 rounded border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                <span>{cat.name} ({cat.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Severity Weight load */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" /> Urgency Load Segments
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">SLA Priority</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name as Severity]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconSize={10} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-bold text-slate-600 font-sans">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Progress Stages Breakdown */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            ⚙️ Resolution Pipeline Status
          </h3>
          <span className="text-[10px] text-blue-600 font-bold uppercase">Dynamic workflow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {statusData.map(stat => {
            const color = STATUS_COLORS[stat.name as IssueStatus];
            const percent = metrics.totalGrievances > 0 ? Math.round((stat.value / metrics.totalGrievances) * 100) : 0;
            return (
              <div key={stat.name} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-450 tracking-wider block">{stat.name}</span>
                  <div className="text-xl font-black mt-1" style={{ color }}>{stat.value}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Ratio</span>
                    <span>{percent}%</span>
                  </div>
                  {/* Styled Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
