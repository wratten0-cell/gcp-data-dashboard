import React from 'react';
import { X, Package, DollarSign, Calendar, MapPin, CheckCircle } from 'lucide-react';

export function DetailSidePanel({ record, onClose, onApprove, onFlag }) {
  if (!record) return null;

  return (
    <div className="w-full lg:w-96 flex-shrink-0 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Shipment Details</span>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">{record.id}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Package Service Tier Badge */}
        <div className="p-3.5 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-500" />
              Service Category
            </span>
            <span className="text-xs font-bold font-mono">{record.segment || record.package_type || 'Ground Advantage'}</span>
          </div>
          <p className="text-[11px] mt-1 text-zinc-600 dark:text-zinc-300">
            Tracked in BigQuery table <code>tribal-datum-507019-m0.uploadeddataset.packages</code>.
          </p>
        </div>

        {/* Detailed Attribute Blocks */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Package ID</span>
            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{record.id}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Postage Revenue</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">${Number(record.amount || record.revenue || 0).toFixed(2)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Type</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{record.segment || 'Ground Advantage'}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Destination</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{record.region || 'Regional Hub'}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
