import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown
} from 'lucide-react';

export function DataTable({ 
  rows = [], 
  selectedRow = null, 
  onSelectRow,
  title = "USPS Package Shipments"
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Distinct Filter Options
  const segments = useMemo(() => {
    const set = new Set(rows.map(r => r.segment).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [rows]);

  const statuses = useMemo(() => {
    const set = new Set(rows.map(r => r.status).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [rows]);

  // Filtered & Searched Data
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchSearch = searchTerm === '' || 
        r.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.region?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSegment = selectedSegment === 'ALL' || r.segment === selectedSegment;
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;

      return matchSearch && matchSegment && matchStatus;
    });
  }, [rows, searchTerm, selectedSegment, selectedStatus]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between transition-colors">
      
      {/* Table Toolbar */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{title}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            BigQuery source dataset • Showing {filteredRows.length} filtered rows
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search customer, ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Segment Dropdown */}
          <select
            value={selectedSegment}
            onChange={(e) => { setSelectedSegment(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {segments.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Segments' : s}</option>)}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {statuses.map(st => <option key={st} value={st}>{st === 'ALL' ? 'All Statuses' : st}</option>)}
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 z-10">
            <tr>
              <th className="py-2.5 px-4 font-mono">Package ID</th>
              <th className="py-2.5 px-4">Package Type</th>
              <th className="py-2.5 px-4">Revenue ($)</th>
              <th className="py-2.5 px-4">Destination</th>
              <th className="py-2.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-400">
                  No records match the current filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isSelected = selectedRow?.id === row.id;

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectRow && onSelectRow(row)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-850/60'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {row.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-[11px]">
                        {row.segment || row.package_type || 'Ground Advantage'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      ${Number(row.amount || row.revenue || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">
                      {row.region || row.destination || 'Hub'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        row.status === 'Completed' || row.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                        row.status === 'Pending' || row.status === 'In Transit' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {row.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Page {currentPage} of {totalPages} ({filteredRows.length} items)
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
            className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            title="Previous Page"
            className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            title="Next Page"
            className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
            className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
