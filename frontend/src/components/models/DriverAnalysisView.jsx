import React from 'react';
import { EChartCard } from '../dashboard/EChartCard';
import { Layers, Target, HelpCircle } from 'lucide-react';

export function DriverAnalysisView({ result }) {
  if (!result || !result.drivers) return null;

  const features = result.drivers.map(d => d.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).reverse();
  const importances = result.drivers.map(d => (d.importance_score * 100)).reverse();

  const driverOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: <strong>{c}% Importance</strong>'
    },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' },
      name: 'Impact (%)'
    },
    yAxis: {
      type: 'category',
      data: features,
      axisLabel: { fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: importances,
      itemStyle: {
        color: function (params) {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
          return colors[params.dataIndex % colors.length];
        },
        borderRadius: [0, 6, 6, 0]
      },
      barWidth: '50%'
    }]
  };

  return (
    <div className="space-y-6">
      {/* Top Driver Headline */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 block mb-0.5">
            Primary Causal Driver Identified
          </span>
          <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
            {result.summary?.top_driver?.replace(/_/g, ' ').toUpperCase()}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Accounts for <strong>{result.summary?.top_driver_impact}</strong> of total variance in model predictions.
          </p>
        </div>

        <div className="text-right">
          <span className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
            {result.summary?.top_driver_impact}
          </span>
          <span className="text-[10px] block text-zinc-400">Weight</span>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <EChartCard
        title="BigQuery ML Key Drivers & Contribution Importance"
        description="Ranked influence weights of behavioral features on target outcome"
        option={driverOption}
        sql={`SELECT * FROM ML.CONTRIBUTION_ANALYSIS(MODEL \`${result.model_id}\`);`}
        height={360}
      />

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {result.drivers.map((d, i) => (
          <div key={i} className="p-3.5 rounded-lg bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-100">{d.feature.replace(/_/g, ' ')}</h5>
              <span className="text-[11px] text-zinc-500">{d.direction}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{(d.importance_score * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
