import React, { useState } from 'react';
import { Play, Check, Copy, Database } from 'lucide-react';
import { executeSqlQuery } from '../../services/api';

export function SqlPreviewCard({ sql }) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSql = async () => {
    setIsRunning(true);
    try {
      const res = await executeSqlQuery(sql, 5);
      setQueryResult(res);
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="my-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 overflow-hidden text-xs font-mono shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-950 border-b border-zinc-800 text-zinc-400">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
          <Database className="w-3.5 h-3.5" />
          <span>BigQuery Generated SQL</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleRunSql}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-[10px] disabled:opacity-50"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Execute SQL'}</span>
          </button>
        </div>
      </div>

      {/* Code Block */}
      <div className="p-3.5 overflow-x-auto text-emerald-400/90 leading-relaxed">
        <pre>{sql}</pre>
      </div>

      {/* Query Execution Result */}
      {queryResult && (
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-[11px]">
          {queryResult.success ? (
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="text-emerald-400 font-semibold">Query executed successfully ({queryResult.row_count} rows)</span>
                <span>{queryResult.execution_time_ms} ms</span>
              </div>
              <div className="overflow-x-auto max-h-36">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                      {queryResult.columns.map(col => <th key={col} className="p-1">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {queryResult.rows.map((r, i) => (
                      <tr key={i}>
                        {queryResult.columns.map(col => <td key={col} className="p-1 truncate max-w-[120px]">{String(r[col])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-rose-400">
              Error executing query: {queryResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
