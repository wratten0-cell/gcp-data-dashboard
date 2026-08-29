import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  RotateCw, 
  Layers, 
  Calendar, 
  Database,
  Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDashboard, deleteDashboard } from '../../services/api';
import { KPIGrid } from '../dashboard/KPIGrid';
import { EChartCard } from '../dashboard/EChartCard';

export function DynamicDashboardView() {
  const { activeDashboardId, setActiveView, setActiveDashboardId, refreshDashboards } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeDashboardId) {
      loadDashboard(activeDashboardId);
    }
  }, [activeDashboardId]);

  const loadDashboard = async (id) => {
    setIsLoading(true);
    try {
      const data = await getDashboard(id);
      setDashboard(data);
    } catch (err) {
      console.warn('Could not load dynamic dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this generated dashboard?')) {
      try {
        await deleteDashboard(activeDashboardId);
        await refreshDashboards();
        setActiveView('overview');
        setActiveDashboardId(null);
      } catch (err) {
        alert('Could not delete dashboard.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center p-12">
        <p className="text-zinc-500">Dashboard not found or was removed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
              AI Generated View
            </span>
            <span className="text-xs text-zinc-400 font-mono">{dashboard.created_at}</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {dashboard.title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dashboard.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!dashboard.is_default && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Generated KPIs */}
      {dashboard.kpis && <KPIGrid kpis={dashboard.kpis} />}

      {/* Generated ECharts Visualizations */}
      <div className="space-y-6">
        {dashboard.charts?.map((chart, idx) => (
          <div key={chart.id || idx} className="w-full">
            <EChartCard
              title={chart.title}
              description={chart.description}
              option={chart.option}
              sql={chart.sql}
              height={380}
            />
          </div>
        ))}
      </div>

    </div>
  );
}
