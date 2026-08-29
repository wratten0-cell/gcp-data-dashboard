import React from 'react';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Database, 
  Sparkles, 
  Plus, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  Trash2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { deleteDashboard } from '../../services/api';

export function Sidebar() {
  const { 
    activeView, 
    setActiveView, 
    activeDashboardId, 
    setActiveDashboardId, 
    dashboardsList, 
    refreshDashboards,
    setIsGenModalOpen 
  } = useApp();

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom dashboard?')) {
      try {
        await deleteDashboard(id);
        await refreshDashboards();
        if (activeDashboardId === id) {
          setActiveView('overview');
          setActiveDashboardId(null);
        }
      } catch (err) {
        alert('Could not delete dashboard.');
      }
    }
  };

  const selectDynamicDashboard = (id) => {
    setActiveDashboardId(id);
    setActiveView('dynamic');
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] min-h-[calc(100vh-61px)] flex flex-col justify-between p-4 transition-colors">
      <div className="space-y-6">
        
        {/* Core Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
            Main Navigation
          </p>

          <button
            onClick={() => { setActiveView('overview'); setActiveDashboardId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => { setActiveView('models'); setActiveDashboardId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'models'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <div className="flex items-center justify-between w-full">
              <span>GCP AI/ML Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 font-mono">
                Vertex
              </span>
            </div>
          </button>

          <button
            onClick={() => { setActiveView('explorer'); setActiveDashboardId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'explorer'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>BigQuery Explorer</span>
          </button>
        </div>

        {/* Dynamic & AI-Generated Dashboards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Generated Dashboards
            </p>
            <button
              onClick={() => setIsGenModalOpen(true)}
              title="Generate new dashboard from text prompt"
              className="text-zinc-400 hover:text-blue-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {dashboardsList.map((dash) => {
              const isSelected = activeView === 'dynamic' && activeDashboardId === dash.id;
              return (
                <div
                  key={dash.id}
                  onClick={() => selectDynamicDashboard(dash.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Layers className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                    <span className="truncate">{dash.title}</span>
                  </div>

                  {!dash.is_default && (
                    <button
                      onClick={(e) => handleDelete(e, dash.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-1 transition-all"
                      title="Delete dashboard"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini Data Analyst</span>
        </div>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2.5">
          Ask questions in natural language or request custom charts.
        </p>
        <button
          onClick={() => setIsGenModalOpen(true)}
          className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium text-center transition-colors"
        >
          Prompt to Dashboard
        </button>
      </div>

    </aside>
  );
}
