import React, { useState } from 'react';
import { Database, Play, RotateCw, CheckCircle, Terminal, Copy, Check } from 'lucide-react';
import { executeSqlQuery } from '../../services/api';
import { useApp } from '../../context/AppContext';

const PRESET_QUERIES = [
  {
    name: 'Top 10 ARR Accounts',
    sql: 'SELECT id, customer, segment, region, amount, churn_risk_score, status FROM `analytics_production.transactions` ORDER BY amount DESC LIMIT 10;'
  },
  {
    name: 'Daily Revenue & Anomaly Scan',
    sql: 'SELECT date, revenue, transactions, active_users, is_anomaly, anomaly_score FROM `analytics_production.daily_kpis` ORDER BY date DESC LIMIT 30;'
  },
  {
    name: 'Churn Risk by Customer Tier',
    sql: 'SELECT segment, COUNT(id) as total_accounts, AVG(churn_risk_score) * 100 as avg_churn_pct, SUM(amount) as total_arr FROM `analytics_production.transactions` GROUP BY segment;'
  },
  {
    name: 'BigQuery Slot Consumption (Per Min)',
    sql: 'SELECT timestamp, bq_slot_consumption_per_min, latency_ms, error_rate_pct FROM `analytics_production.infra_utilization` ORDER BY timestamp DESC LIMIT 20;'
  }
];

export function DataExplorerView() {
  const { gcpStatus } = useApp();
  const [sql, setSql] = useState(PRESET_QUERIES[0].sql);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    if (!sql.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await executeSqlQuery(sql, 100);
      setResult(res);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Terminal className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">BigQuery SQL Studio</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Interactive Query Workspace
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Query tables in `{gcpStatus.project_id}.{gcpStatus.dataset_id}` with live execution statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>
          
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {isLoading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isLoading ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex-shrink-0">
          Sample Queries:
        </span>
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setSql(q.sql)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 transition-colors"
          >
            {q.name}
          </button>
        ))}
      </div>

      {/* SQL Editor Area */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2">BigQuery Query Console</span>
          </div>
          <span>Dialect: GoogleSQL</span>
        </div>

        <textarea
          rows={5}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className="w-full bg-transparent p-4 font-mono text-xs text-emerald-400/90 placeholder-zinc-500 focus:outline-none resize-y"
          placeholder="SELECT * FROM `dataset.table` WHERE..."
        />
      </div>

      {/* Results View */}
      {result && (
        <div className="rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            {result.success ? (
              <div className="flex items-center gap-3">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Query Successful
                </span>
                <span className="text-zinc-400 font-mono">|</span>
                <span className="text-zinc-500 font-mono">{result.row_count} rows returned</span>
                <span className="text-zinc-400 font-mono">|</span>
                <span className="text-zinc-500 font-mono">{result.execution_time_ms} ms</span>
              </div>
            ) : (
              <span className="text-rose-500 font-semibold">Query Execution Failed</span>
            )}
          </div>

          {result.success && (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800 z-10">
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col} className="py-2.5 px-4 font-mono">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {result.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/50">
                      {result.columns.map((col) => (
                        <td key={col} className="py-2.5 px-4 font-mono text-[11px] truncate max-w-[200px]">
                          {String(row[col] ?? 'null')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!result.success && (
            <div className="p-4 text-xs font-mono text-rose-500 bg-rose-50/50 dark:bg-rose-950/20">
              {result.error}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
