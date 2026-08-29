import React from 'react';
import { X, Shield, Activity, DollarSign, Calendar, Server, CheckCircle, AlertOctagon } from 'lucide-react';

export function DetailSidePanel({ record, onClose, onApprove, onFlag }) {
  if (!record) return null;

  const churnRisk = (record.churn_risk_score || 0) * 100;
  const isHighRisk = churnRisk > 40;

  return (
    <div className="w-full lg:w-96 flex-shrink-0 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Account Deep Dive</span>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">{record.customer}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Churn & ML Risk Badge */}
        <div className={`p-3.5 rounded-lg border ${
          isHighRisk 
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200' 
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              {isHighRisk ? <AlertOctagon className="w-4 h-4 text-rose-500" /> : <Shield className="w-4 h-4 text-emerald-500" />}
              BigQuery ML Churn Score
            </span>
            <span className="text-xs font-bold font-mono">{churnRisk.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'} transition-all`}
              style={{ width: `${churnRisk}%` }}
            />
          </div>
          <p className="text-[11px] mt-2 text-zinc-600 dark:text-zinc-300">
            {isHighRisk 
              ? 'Model flagged elevated churn probability due to support ticket spike.' 
              : 'Stable enterprise account with steady consumption trajectory.'}
          </p>
        </div>

        {/* Detailed Attribute Blocks */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Transaction ID</span>
            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{record.id}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Amount / ARR</span>
            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">${record.amount?.toLocaleString()}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Segment</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{record.segment}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Region</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">{record.region}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Contract Term</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{record.contract_months || 24} Months</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Open Tickets</span>
            <span className="font-mono font-semibold text-amber-500">{record.support_tickets_open || 0} Open</span>
          </div>
        </div>

        {/* SLA Status */}
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between">
          <span className="text-zinc-500">SLA Compliance:</span>
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{record.sla_compliance_pct || 99.4}%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
        <button
          onClick={() => onApprove && onApprove(record)}
          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Confirm Action</span>
        </button>
        <button
          onClick={() => onFlag && onFlag(record)}
          className="py-2 px-3 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
        >
          Flag Review
        </button>
      </div>
    </div>
  );
}
