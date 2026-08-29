import React, { useState, useEffect } from 'react';
import { X, Settings, Database, Key, Globe, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { updateGcpConfig } from '../../services/api';

export function GcpSettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, gcpStatus, refreshStatus } = useApp();
  
  const [projectId, setProjectId] = useState(gcpStatus.project_id || '');
  const [datasetId, setDatasetId] = useState(gcpStatus.dataset_id || '');
  const [region, setRegion] = useState(gcpStatus.region || 'us-central1');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [demoMode, setDemoMode] = useState(gcpStatus.mode === 'demo');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setProjectId(gcpStatus.project_id || '');
    setDatasetId(gcpStatus.dataset_id || '');
    setRegion(gcpStatus.region || 'us-central1');
    setDemoMode(gcpStatus.mode === 'demo');
  }, [gcpStatus]);

  if (!isSettingsOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = {
        project_id: projectId,
        dataset_id: datasetId,
        region: region,
        demo_mode: demoMode,
      };
      if (geminiApiKey.trim()) {
        payload.gemini_api_key = geminiApiKey.trim();
      }

      await updateGcpConfig(payload);
      await refreshStatus();
      setMessage({ type: 'success', text: 'GCP environment settings updated successfully.' });
      setTimeout(() => {
        setIsSettingsOpen(false);
        setMessage(null);
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to save settings: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              GCP Connection & Environment
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure Google BigQuery, Vertex AI, and Gemini AI credentials.
            </p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-xs font-medium ${
            message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          
          {/* Live vs Demo Mode Toggle */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">Operation Engine</span>
              <span className="text-[11px] text-zinc-500">
                {demoMode ? 'Using realistic enterprise sandbox data' : 'Connecting directly to live GCP project'}
              </span>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                demoMode 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
              }`}
            >
              {demoMode ? 'Demo Sandbox' : 'Live GCP Mode'}
            </button>
          </div>

          {/* Project ID */}
          <div className="space-y-1">
            <label className="text-zinc-600 dark:text-zinc-400 font-medium">GCP Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., enterprise-analytics-prod-01"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Dataset ID */}
          <div className="space-y-1">
            <label className="text-zinc-600 dark:text-zinc-400 font-medium">BigQuery Dataset ID</label>
            <input
              type="text"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              placeholder="e.g., analytics_production"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Region */}
          <div className="space-y-1">
            <label className="text-zinc-600 dark:text-zinc-400 font-medium">GCP Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="us-central1">us-central1 (Iowa)</option>
              <option value="us-east4">us-east4 (N. Virginia)</option>
              <option value="us-west1">us-west1 (Oregon)</option>
              <option value="europe-west1">europe-west1 (Belgium)</option>
              <option value="asia-east1">asia-east1 (Taiwan)</option>
            </select>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1">
            <label className="text-zinc-600 dark:text-zinc-400 font-medium">
              Gemini API Key (Optional for live LLM inference)
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder={gcpStatus.has_gemini_key ? '••••••••••••••••••••••••' : 'AIzaSy...'}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {isSaving ? 'Saving...' : 'Apply Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
}
