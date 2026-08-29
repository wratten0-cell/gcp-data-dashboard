import React from 'react';
import { EChartCard } from '../dashboard/EChartCard';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export function AnomalyView({ result }) {
  if (!result || !result.chart_data) return null;

  const dates = result.chart_data.map(d => d.timestamp);
  const actuals = result.chart_data.map(d => d.actual_value);
  const expecteds = result.chart_data.map(d => d.expected_value);

  // Filter outlier markers for ECharts markPoint
  const markPoints = result.chart_data
    .filter(d => d.is_anomaly)
    .map(d => ({
      name: `Anomaly (${d.severity})`,
      coord: [d.timestamp, d.actual_value],
      value: `${d.severity}: ${d.actual_value}`,
      itemStyle: { color: '#ef4444' }
    }));

  const anomalyOption = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let date = params[0].name;
        let actual = params.find(p => p.seriesName === 'Actual Metric')?.value || 0;
        let expected = params.find(p => p.seriesName === 'Expected Baseline')?.value || 0;
        return `<strong>${date}</strong><br/>
                <span style="color:#3b82f6">●</span> Actual: <strong>${actual}</strong><br/>
                <span style="color:#a1a1aa">●</span> Expected: ${expected}`;
      }
    },
    legend: {
      data: ['Actual Metric', 'Expected Baseline'],
      top: 0
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
      name: 'Slots / Minute'
    },
    series: [
      {
        name: 'Actual Metric',
        type: 'line',
        data: actuals,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2.5 },
        markPoint: {
          data: markPoints,
          symbolSize: 45,
          label: { fontSize: 10, color: '#ffffff' }
        }
      },
      {
        name: 'Expected Baseline',
        type: 'line',
        data: expecteds,
        lineStyle: { type: 'dashed', color: '#a1a1aa', width: 1.5 },
        itemStyle: { color: '#a1a1aa' },
        symbol: 'none'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Status</span>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {result.summary?.status}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Anomalies Detected</span>
          <h3 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            {result.summary?.anomalies_detected} Outliers
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Peak Anomaly Probability</span>
          <h3 className="text-2xl font-bold font-mono text-amber-500">
            {((result.summary?.highest_anomaly_prob || 0) * 100).toFixed(1)}%
          </h3>
        </div>
      </div>

      {/* Main Chart */}
      <EChartCard
        title="BigQuery ML Anomaly Detection (AI.DETECT_ANOMALIES)"
        description="Historical resource timeline with automated outlier detection"
        option={anomalyOption}
        sql={`SELECT * FROM ML.DETECT_ANOMALIES(MODEL \`${result.model_id}\`, STRUCT(${result.contamination} AS contamination));`}
        height={380}
      />

      {/* Flagged Outliers Table */}
      {result.anomalies && result.anomalies.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
            Flagged Outlier Incidents
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <tr>
                  <th className="p-2 font-mono">Timestamp</th>
                  <th className="p-2">Actual Value</th>
                  <th className="p-2">Expected Baseline</th>
                  <th className="p-2">Anomaly Prob</th>
                  <th className="p-2">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {result.anomalies.map((anom, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                    <td className="p-2 font-mono text-zinc-500">{anom.timestamp}</td>
                    <td className="p-2 font-mono font-bold text-rose-600 dark:text-rose-400">{anom.actual_value}</td>
                    <td className="p-2 font-mono text-zinc-400">{anom.expected_value}</td>
                    <td className="p-2 font-mono font-semibold">{(anom.anomaly_probability * 100).toFixed(1)}%</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {anom.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
