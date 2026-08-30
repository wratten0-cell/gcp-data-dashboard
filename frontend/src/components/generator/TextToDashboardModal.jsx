import React, { useState } from 'react';
import { X, Sparkles, Wand2, RotateCw, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateDashboardFromText } from '../../services/api';

const EXAMPLE_PROMPTS = [
  'Show standard deviation and variance of package revenue',
  'Compare average price between Ground Advantage and Priority Mail',
  'Revenue dot plot dispersion across shipping tiers',
  'Analyze Ground Advantage volume (60 packages) vs Priority Mail',
];

export function TextToDashboardModal() {
  const { 
    isGenModalOpen, 
    setIsGenModalOpen, 
    refreshDashboards, 
    setActiveDashboardId, 
    setActiveView 
  } = useApp();
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isGenModalOpen) return null;

  const handleGenerate = async (queryText = null) => {
    const text = (queryText || prompt).trim();
    if (!text || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await generateDashboardFromText(text);
      if (response.success && response.dashboard) {
        await refreshDashboards();
        setActiveDashboardId(response.dashboard.id);
        setActiveView('dynamic');
        setIsGenModalOpen(false);
        setPrompt('');
      }
    } catch (err) {
      alert(`Dashboard generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsGenModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              Generate Dashboard from Text
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Describe what metrics and charts you want. Gemini will synthesize BigQuery SQL, KPIs, and ECharts visuals.
            </p>
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-3">
          <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all p-1">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Show standard deviation of revenue, or compare Ground Advantage vs Priority Mail..."
              className="w-full bg-transparent p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none"
            />

            <div className="flex justify-end p-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Visuals & SQL...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Generate New Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Starter Templates */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Or Choose an Example Prompt
            </span>
            <div className="space-y-1.5">
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerate(ex)}
                  disabled={isGenerating}
                  className="w-full text-left p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-zinc-200 dark:border-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between group transition-colors"
                >
                  <span className="truncate pr-2">{ex}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
