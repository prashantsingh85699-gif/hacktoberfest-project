import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Camera, AlertCircle, Clock, Trash2, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { listScanRecords, clearAllScanRecords } from '../lib/history.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { STATUS_CONFIG, PRIMARY_STATUS } from '../../shared/constants.js';
import { formatIsoDate } from '../lib/format.js';

const STATUS_COLORS = {
  [PRIMARY_STATUS.EXPIRY_VERIFIED]: '#10B981',
  [PRIMARY_STATUS.ESTIMATED_VERIFIED_INPUTS]: '#3B82F6',
  [PRIMARY_STATUS.VERIFICATION_REQUIRED]: '#F59E0B',
  [PRIMARY_STATUS.DAMAGE_SUSPECTED]: '#EF4444',
  [PRIMARY_STATUS.MANUAL_INSPECTION_REQUIRED]: '#8B5CF6',
  [PRIMARY_STATUS.EXPIRY_NOT_FOUND]: '#64748B',
};

export function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listScanRecords().then((list) => {
      setRecords(list);
      setLoading(false);
    });
  }, []);

  const handleClear = async () => {
    if (!confirm('Clear all local inspection records?')) return;
    await clearAllScanRecords();
    setRecords([]);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center">
        <p className="text-sm text-slate-500">Loading your pantry & health dashboard...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
          <Camera className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-lg text-[#0B1F33]">
          No Inspection History Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Take a photo of a packaged food, medicine, or cosmetic product to verify its printed expiry or investigate manufacturer shelf life.
        </p>
        <Link
          to="/scan"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Camera className="w-4 h-4" />
          Start First Inspection
        </Link>
      </div>
    );
  }

  // Compute status chart data
  const statusCounts = {};
  for (const r of records) {
    const st = r.assessment?.primaryStatus || 'OTHER';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  }

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_CONFIG[status]?.label || status,
    value: count,
    status,
  }));

  // Expiring soon items (within 30 days)
  const expiringSoon = records.filter(
    (r) => r.assessment?.expiryState === 'expiring_soon' || r.assessment?.expiryState === 'expired'
  );

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EF]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F33] font-heading">
            Inspection Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your locally verified products and expiring items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Camera className="w-4 h-4" />
            Inspect New
          </Link>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Local Data
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Inspected
          </span>
          <span className="text-3xl font-extrabold text-[#0B1F33] font-heading mt-1 block">
            {records.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Stored strictly in browser</span>
        </div>

        <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
            Expiring or Expired
          </span>
          <span className="text-3xl font-extrabold text-rose-600 font-heading mt-1 block">
            {expiringSoon.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Past or within 30 days</span>
        </div>

        <div className="bg-white border border-[#E5E7EF] rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
            Verified In-Date
          </span>
          <span className="text-3xl font-extrabold text-emerald-600 font-heading mt-1 block">
            {records.filter((r) => r.assessment?.expiryState === 'in_date').length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Passes date verification</span>
        </div>
      </div>

      {/* Donut Chart & Expiring Soon List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-[#0B1F33]">
            Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#64748B'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {chartData.map((d) => (
              <div key={d.status} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[d.status] || '#64748B' }}
                />
                <span className="text-slate-600 font-medium">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Soon Watchlist */}
        <div className="bg-white border border-[#E5E7EF] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-[#0B1F33] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Expiring Soon or Expired ({expiringSoon.length})
            </h3>
            <Link to="/history" className="text-xs text-indigo-600 hover:underline font-medium">
              View All
            </Link>
          </div>

          {expiringSoon.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              No products currently expiring within the next 30 days.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expiringSoon.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  to={`/result/${r.id}`}
                  state={{ record: r }}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition-colors group"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {r.extraction?.product?.name || 'Unknown Product'}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Expiry: {formatIsoDate(r.assessment?.expiry?.iso)}
                    </span>
                  </div>
                  <StatusBadge status={r.assessment?.primaryStatus} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

