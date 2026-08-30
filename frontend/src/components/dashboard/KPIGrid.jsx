import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  AlertTriangle,
  Activity,
  Gauge
} from 'lucide-react';

const ICON_MAP = {
  DollarSign,
  ShoppingCart,
  Users,
  Cpu,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Gauge,
  TrendingUp,
};

export function KPIGrid({ kpis }) {
  if (!kpis) return null;

  // Convert object dictionary or array into list
  const kpiList = Array.isArray(kpis) 
    ? kpis 
    : Object.entries(kpis).map(([key, data]) => ({
        title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: data.value,
        change: data.change,
        is_positive: data.is_positive,
        icon: key.includes('revenue') ? 'DollarSign' 
            : key.includes('package') ? 'ShoppingCart' 
            : key.includes('count') ? 'Activity' 
            : key.includes('slot') ? 'Cpu' 
            : key.includes('latency') ? 'Zap' : 'Activity'
      }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiList.map((kpi, idx) => {
        const IconComponent = ICON_MAP[kpi.icon] || Activity;
        const isPos = kpi.is_positive !== false;

        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {kpi.title}
              </span>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
                {kpi.value}
              </h3>

              {kpi.change && (
                <div
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isPos
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {isPos ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{kpi.change}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
