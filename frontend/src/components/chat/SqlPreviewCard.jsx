import React, { useState } from 'react';
import { Check, Copy, Database } from 'lucide-react';

export function SqlPreviewCard({ sql }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 overflow-hidden text-xs font-mono shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-950 border-b border-zinc-800 text-zinc-400">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
          <Database className="w-3.5 h-3.5" />
          <span>Executed BigQuery SQL</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors text-[10px]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Block */}
      <div className="p-3.5 overflow-x-auto text-emerald-400/90 leading-relaxed">
        <pre>{sql}</pre>
      </div>
    </div>
  );
}
