import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Trash2, Camera, ArrowRight, Package } from 'lucide-react';
import { listScanRecords, deleteScanRecord, clearAllScanRecords, exportHistoryAsJson } from '../lib/history.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ProvenanceChip } from '../components/ui/ProvenanceChip.jsx';
import { formatIsoDate } from '../lib/format.js';

export function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    listScanRecords().then((list) => {
      setRecords(list);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Remove this inspection from history?')) return;
    await deleteScanRecord(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleExport = () => {
    exportHistoryAsJson(records);
  };

  const filtered = records.filter((r) => {
    const p = r.extraction?.product || {};
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.extraction?.batchNumbers?.[0]?.value || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || r.assessment?.primaryStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center">
        <p className="text-sm text-slate-500">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EF]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F33] font-heading">
            Inspection History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Private, client-side records saved directly in your browser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <Link
            to="/scan"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            New Scan
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, brand, or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="food">Food & Beverage</option>
            <option value="medicine">Medicine</option>
            <option value="cosmetic">Cosmetics</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="EXPIRY_VERIFIED">Expiry Verified</option>
            <option value="ESTIMATED_VERIFIED_INPUTS">Estimated Expiry</option>
            <option value="VERIFICATION_REQUIRED">Verification Required</option>
            <option value="DAMAGE_SUSPECTED">Damage Suspected</option>
            <option value="EXPIRY_NOT_FOUND">Expiry Not Found</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E7EF] rounded-2xl p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No matching inspections found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or start a new scan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const p = item.extraction?.product || {};
            const exp = item.assessment?.expiry || {};
            const thumbnail = item.images?.[0]?.dataUrl;

            return (
              <Link
                key={item.id}
                to={`/result/${item.id}`}
                state={{ record: item }}
                className="bg-white border border-[#E5E7EF] hover:border-indigo-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {thumbnail ? (
                        <img src={thumbnail} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 block truncate">
                        {p.brand || 'Unbranded'} • {p.category || 'Product'}
                      </span>
                      <h3 className="font-heading font-bold text-sm text-[#0B1F33] group-hover:text-indigo-600 transition-colors truncate">
                        {p.name || 'Unnamed Product'}
                      </h3>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(item.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Expiry Date:
                      </span>
                      <span className="font-heading font-extrabold text-sm text-slate-900">
                        {formatIsoDate(exp.iso)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <ProvenanceChip provenance={exp.provenance} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <StatusBadge status={item.assessment?.primaryStatus} size="sm" />
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    aria-label="Delete scan record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

